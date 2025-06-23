import { getPublicURL, deleteFromS3 } from '$lib/server/minio';
import { prisma } from '$lib/server/prisma';
import { realtimeBroadcaster } from '$lib/server/realtime';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

// PUT /api/projects/[id]/tasks/[taskId] - Update a task
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}
	const { id: projectId, taskId } = params;
	if (!projectId || !taskId) {
		return json({ error: true, message: 'Project ID and Task ID are required' }, { status: 400 });
	}

	try {
		// Check if user is a member of the project and task exists
		const task = await prisma.task.findFirst({
			where: {
				id: taskId,
				projectId: projectId,
				project: {
					members: {
						some: {
							userId: user.id
						}
					}
				}
			}
		});

		if (!task) {
			return json({ error: true, message: 'Task not found' }, { status: 404 });
		}
		const { title, description, status, priority } = await request.json();

		// Convert status from frontend format to enum format
		const statusMap: Record<string, string> = {
			todo: 'Todo',
			'in-progress': 'InProgress',
			done: 'Done'
		};

		// Convert priority from string to number
		const priorityMap: Record<string, number> = {
			low: 1,
			medium: 2,
			high: 3
		};

		const updateData: any = {};

		if (title !== undefined) {
			if (!title || title.trim() === '') {
				return json({ error: true, message: 'Task title cannot be empty' }, { status: 400 });
			}
			updateData.title = title.trim();
		}

		if (description !== undefined) {
			updateData.description = description.trim();
		}

		if (status !== undefined) {
			const mappedStatus = statusMap[status];
			if (!mappedStatus) {
				return json(
					{ error: true, message: 'Invalid status. Must be todo, in-progress, or done' },
					{ status: 400 }
				);
			}
			updateData.status = mappedStatus;
		}

		if (priority !== undefined) {
			const mappedPriority = priorityMap[priority];
			if (!mappedPriority) {
				return json(
					{ error: true, message: 'Invalid priority. Must be low, medium, or high' },
					{ status: 400 }
				);
			}
			updateData.priority = mappedPriority;
		}

		const updatedTask = await prisma.task.update({
			where: {
				id: taskId
			},
			data: updateData,
			include: {
				file: true,
				user: {
					select: {
						id: true,
						name: true,
						avatar: true
					}
				}
			}
		});
		// Transform the response
		const transformedTask = {
			id: updatedTask.id,
			title: updatedTask.title,
			description: updatedTask.description,
			status: updatedTask.status.toLowerCase().replace('inprogress', 'in-progress'),
			priority: updatedTask.priority === 1 ? 'low' : updatedTask.priority === 2 ? 'medium' : 'high',
			projectId: updatedTask.projectId,
			createdAt: updatedTask.createdAt.toISOString(),
			updatedAt: updatedTask.updatedAt.toISOString(),
			user: {
				id: updatedTask.user.id,
				name: updatedTask.user.name,
				avatar: updatedTask.user.avatar
			},
			files: updatedTask.file.map((file) => ({
				id: file.id,
				name: file.name,
				path: getPublicURL(file.path),
				uploadedAt: file.uploadedAt.toISOString()
			}))
		};

		// Broadcast task update event to other users
		if (status !== undefined) {
			// If status changed, broadcast as task moved
			realtimeBroadcaster.broadcastTaskMoved(projectId, transformedTask, user.id);
		} else {
			// Otherwise, broadcast as general task update
			realtimeBroadcaster.broadcastTaskUpdated(projectId, transformedTask, user.id);
		}

		return json(transformedTask);
	} catch (err) {
		console.error('Error updating task:', err);
		return json({ error: true, message: 'Failed to update task' }, { status: 500 });
	}
};

// DELETE /api/projects/[id]/tasks/[taskId] - Delete a task
export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}

	const { id: projectId, taskId } = params;
	if (!projectId || !taskId) {
		return json({ error: true, message: 'Project ID and Task ID are required' }, { status: 400 });
	}

	try {
		// Check if user is a member of the project and task exists
		const task = await prisma.task.findFirst({
			where: {
				id: taskId,
				projectId: projectId,
				project: {
					members: {
						some: {
							userId: user.id
						}
					}
				}
			},
			include: {
				file: true // Include files to delete them from storage
			}
		});

		if (!task) {
			return json({ error: true, message: 'Task not found' }, { status: 404 });
		}

		// Delete files from storage first
		if (task.file && task.file.length > 0) {
			for (const file of task.file) {
				try {
					await deleteFromS3(file.path);
				} catch (error) {
					console.error(`Failed to delete file ${file.path} from storage:`, error);
					// Continue with deletion even if file deletion fails
				}
			}
		}

		// Delete associated files from database, then the task
		await prisma.$transaction([
			prisma.file.deleteMany({
				where: {
					taskId: taskId
				}
			}),
			prisma.task.delete({
				where: {
					id: taskId
				}
			})
		]);

		// Broadcast task deletion event to other users
		realtimeBroadcaster.broadcastTaskDeleted(projectId, taskId, user.id);

		return json({ success: true, message: 'Task deleted successfully' });
	} catch (err) {
		console.error('Error deleting task:', err);
		return json({ error: true, message: 'Failed to delete task' }, { status: 500 });
	}
};

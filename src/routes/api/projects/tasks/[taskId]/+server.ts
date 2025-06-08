import { prisma } from '$lib/server/prisma.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: true, message: 'Unauthorized' }, { status: 401 });
		}

		const { taskId } = params;
		const { status, title, description, priority } = await request.json();

		// Verify the task belongs to the user's project
		const existingTask = await prisma.task.findFirst({
			where: {
				id: taskId,
				project: {
					createdBy: locals.user.id
				}
			},
			include: {
				project: {
					select: {
						id: true,
						name: true
					}
				}
			}
		});

		if (!existingTask) {
			return json({ error: true, message: 'Task not found or access denied' }, { status: 404 });
		}

		// Convert status from frontend format to enum format
		const statusMap: Record<string, string> = {
			'todo': 'Todo',
			'in-progress': 'InProgress', 
			'done': 'Done'
		};

		// Convert priority from string to number
		const priorityMap: Record<string, number> = {
			'low': 1,
			'medium': 2,
			'high': 3
		};

		const updateData: any = {};

		if (title !== undefined) {
			updateData.title = title;
		}

		if (description !== undefined) {
			updateData.description = description;
		}

		if (status !== undefined) {
			const mappedStatus = statusMap[status];
			if (mappedStatus) {
				updateData.status = mappedStatus;
			}
		}

		if (priority !== undefined) {
			const mappedPriority = priorityMap[priority];
			if (mappedPriority) {
				updateData.priority = mappedPriority;
			}
		}

		// Update the task
		const updatedTask = await prisma.task.update({
			where: { id: taskId },
			data: updateData,
			include: {
				project: {
					select: {
						id: true,
						name: true
					}
				}
			}
		});

		return json({
			id: updatedTask.id,
			title: updatedTask.title,
			description: updatedTask.description,
			status: updatedTask.status.toLowerCase().replace('inprogress', 'in-progress'),
			priority: updatedTask.priority === 1 ? 'low' : updatedTask.priority === 2 ? 'medium' : 'high',
			projectId: updatedTask.projectId,
			projectName: updatedTask.project.name,
			createdAt: updatedTask.createdAt.toISOString(),
			updatedAt: updatedTask.updatedAt.toISOString()
		});
	} catch (error) {
		console.error('Error updating task:', error);
		return json({ error: true, message: 'Internal server error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: true, message: 'Unauthorized' }, { status: 401 });
		}

		const { taskId } = params;

		// Verify the task belongs to the user's project
		const existingTask = await prisma.task.findFirst({
			where: {
				id: taskId,
				project: {
					createdBy: locals.user.id
				}
			}
		});

		if (!existingTask) {
			return json({ error: true, message: 'Task not found or access denied' }, { status: 404 });
		}

		// Delete the task
		await prisma.task.delete({
			where: { id: taskId }
		});

		return json({ success: true, message: 'Task deleted successfully' });
	} catch (error) {
		console.error('Error deleting task:', error);
		return json({ error: true, message: 'Internal server error' }, { status: 500 });
	}
};

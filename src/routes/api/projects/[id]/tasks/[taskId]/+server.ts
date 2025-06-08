import type { RequestHandler } from '@sveltejs/kit';
import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

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
		// Check if user owns the project and task exists
		const task = await prisma.task.findFirst({
			where: {
				id: taskId,
				projectId: projectId,
				project: {
					createdBy: user.id
				}
			}
		});

		if (!task) {
			return json({ error: true, message: 'Task not found' }, { status: 404 });
		}

		const { text, status } = await request.json();
		const validStatuses = ['Todo', 'InProgress', 'Done'];

		const updateData: any = {};

		if (text !== undefined) {
			if (!text || text.trim() === '') {
				return json({ error: true, message: 'Task text cannot be empty' }, { status: 400 });
			}
			updateData.text = text.trim();
		}
		if (status !== undefined) {
			if (!validStatuses.includes(status)) {
				return json({ error: true, message: 'Invalid status. Must be Todo, InProgress, or Done' }, { status: 400 });
			}
			updateData.status = status;
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
						profilePictureUrl: true
					}
				}
			}
		});

		return json({ success: true, task: updatedTask });
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
		// Check if user owns the project and task exists
		const task = await prisma.task.findFirst({
			where: {
				id: taskId,
				projectId: projectId,
				project: {
					createdBy: user.id
				}
			}
		});

		if (!task) {
			return json({ error: true, message: 'Task not found' }, { status: 404 });
		}

		// Delete associated files first, then the task
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

		return json({ success: true, message: 'Task deleted successfully' });
	} catch (err) {
		console.error('Error deleting task:', err);
		return json({ error: true, message: 'Failed to delete task' }, { status: 500 });
	}
};

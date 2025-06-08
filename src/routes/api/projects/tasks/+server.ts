import { prisma } from '$lib/server/prisma.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.user) {
			return json({ error: true, message: 'Unauthorized' }, { status: 401 });
		}

		// Get all tasks from all projects belonging to the user
		const tasks = await prisma.task.findMany({
			where: {
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
			},
			orderBy: {
				createdAt: 'desc'
			}
		});

		return json({
			success: true,
			tasks: tasks.map((task) => ({
				id: task.id,
				title: task.title,
				description: task.description,
				status: task.status.toLowerCase().replace('inprogress', 'in-progress'),
				priority: task.priority === 1 ? 'low' : task.priority === 2 ? 'medium' : 'high',
				projectId: task.projectId,
				projectName: task.project.name,
				createdAt: task.createdAt.toISOString(),
				updatedAt: task.updatedAt.toISOString()
			}))
		});
	} catch (error) {
		console.error('Error fetching tasks:', error);
		return json({ error: true, message: 'Internal server error' }, { status: 500 });
	}
};

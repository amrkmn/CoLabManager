import type { RequestHandler } from '@sveltejs/kit';
import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

// GET /api/projects/[id]/tasks - Get all tasks for a specific project
export const GET: RequestHandler = async ({ params, locals, url }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}

	const projectId = params.id;
	if (!projectId) {
		return json({ error: true, message: 'Project ID is required' }, { status: 400 });
	}

	// Check if user owns the project
	const project = await prisma.project.findFirst({
		where: {
			id: projectId,
			createdBy: user.id
		}
	});

	if (!project) {
		return json({ error: true, message: 'Project not found' }, { status: 404 });
	}

	try {
		const status = url.searchParams.get('status');
		const whereClause: any = {
			projectId: projectId
		};

		if (status && ['Todo', 'InProgress', 'Done'].includes(status)) {
			whereClause.status = status;
		}
		const tasks = await prisma.task.findMany({
			where: whereClause,
			orderBy: {
				createdAt: 'desc'
			},
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

		// Transform the response to match the expected format
		const transformedTasks = tasks.map((task) => ({
			id: task.id,
			title: task.title,
			description: task.description,
			status: task.status.toLowerCase().replace('inprogress', 'in-progress'), // Convert enum to lowercase with hyphen
			priority: task.priority === 1 ? 'low' : task.priority === 2 ? 'medium' : 'high',
			projectId: task.projectId,
			createdAt: task.createdAt.toISOString(),
			updatedAt: task.updatedAt.toISOString()
		}));

		return json({ success: true, tasks: transformedTasks });
	} catch (err) {
		console.error('Error fetching project tasks:', err);
		return json({ error: true, message: 'Failed to fetch project tasks' }, { status: 500 });
	}
};

// POST /api/projects/[id]/tasks - Create a new task for a project
export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}

	const projectId = params.id;
	if (!projectId) {
		return json({ error: true, message: 'Project ID is required' }, { status: 400 });
	}

	// Check if user owns the project
	const project = await prisma.project.findFirst({
		where: {
			id: projectId,
			createdBy: user.id
		}
	});

	if (!project) {
		return json({ error: true, message: 'Project not found' }, { status: 404 });
	}
	try {
		const { title, description = '', status, priority = 'medium' } = await request.json();

		if (!title || title.trim() === '') {
			return json({ error: true, message: 'Task title is required' }, { status: 400 });
		}

		// Convert status from frontend format to enum format
		const statusMap: Record<string, string> = {
			todo: 'Todo',
			'in-progress': 'InProgress',
			done: 'Done'
		};

		const taskStatus = status && statusMap[status] ? statusMap[status] : 'Todo';

		// Convert priority from string to number
		const priorityMap: Record<string, number> = {
			low: 1,
			medium: 2,
			high: 3
		};

		const taskPriority = priorityMap[priority] || 2;

		const task = await prisma.task.create({
			data: {
				title: title.trim(),
				description: description.trim(),
				status: taskStatus as any,
				priority: taskPriority,
				userId: user.id,
				projectId: projectId
			},
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

		// Transform the response
		const transformedTask = {
			id: task.id,
			title: task.title,
			description: task.description,
			status: task.status.toLowerCase().replace('inprogress', 'in-progress'),
			priority: task.priority === 1 ? 'low' : task.priority === 2 ? 'medium' : 'high',
			projectId: task.projectId,
			createdAt: task.createdAt.toISOString(),
			updatedAt: task.updatedAt.toISOString()
		};

		return json(transformedTask, { status: 201 });
	} catch (err) {
		console.error('Error creating task:', err);
		return json({ error: true, message: 'Failed to create task' }, { status: 500 });
	}
};

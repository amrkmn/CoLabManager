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
		return json({ success: true, tasks });
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
		const { text, status } = await request.json();

		if (!text || text.trim() === '') {
			return json({ error: true, message: 'Task text is required' }, { status: 400 });
		}

		const validStatuses = ['Todo', 'InProgress', 'Done'];
		const taskStatus = status && validStatuses.includes(status) ? status : 'Todo';

		const task = await prisma.task.create({
			data: {
				text: text.trim(),
				status: taskStatus,
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

		return json({ success: true, task }, { status: 201 });
	} catch (err) {
		console.error('Error creating task:', err);
		return json({ error: true, message: 'Failed to create task' }, { status: 500 });
	}
};

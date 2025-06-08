import type { RequestHandler } from '@sveltejs/kit';
import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

// GET /api/projects - Get all projects for the authenticated user
export const GET: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}
	try {
		const projects = await prisma.project.findMany({
			where: {
				createdBy: user.id
			},
			orderBy: {
				createdAt: 'desc'
			},
			include: {
				_count: {
					select: {
						tasks: true,
						files: true,
						messages: true
					}
				}
			}
		});

		return json({ success: true, projects });
	} catch (err) {
		console.error('Error fetching projects:', err);
		return json({ error: true, message: 'Failed to fetch projects' }, { status: 500 });
	}
};

// POST /api/projects - Create a new project
export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}
	try {
		const { name, description } = await request.json();

		if (!name || name.trim() === '') {
			return json({ error: true, message: 'Project name is required' }, { status: 400 });
		}

		const project = await prisma.project.create({
			data: {
				name: name.trim(),
				description: description?.trim() || null,
				createdBy: user.id
			},
			include: {
				_count: {
					select: {
						tasks: true,
						files: true,
						messages: true
					}
				}
			}
		});

		return json({ success: true, project }, { status: 201 });
	} catch (err) {
		console.error('Error creating project:', err);
		return json({ error: true, message: 'Failed to create project' }, { status: 500 });
	}
};

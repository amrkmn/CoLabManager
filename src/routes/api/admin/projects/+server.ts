import { prisma } from '$lib/server/prisma';
import { isNullish } from '@sapphire/utilities';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET /api/admin/projects - Get all projects (admin only)
export const GET: RequestHandler = async ({ locals, url }) => {
	const user = locals.user;
	if (!user || user.role !== 'Admin') {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '10');
		const search = url.searchParams.get('search') || '';
		const skip = (page - 1) * limit;

		const where = search
			? {
					OR: [
						{ name: { contains: search, mode: 'insensitive' as const } },
						{ description: { contains: search, mode: 'insensitive' as const } },
						{ user: { name: { contains: search, mode: 'insensitive' as const } } }
					]
				}
			: {};

		const [projects, totalCount] = await Promise.all([
			prisma.project.findMany({
				where,
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' },
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true
						}
					},
					_count: {
						select: {
							tasks: true,
							files: true,
							messages: true
						}
					}
				}
			}),
			prisma.project.count({ where })
		]);

		const totalPages = Math.ceil(totalCount / limit);

		return json({
			success: true,
			projects,
			pagination: {
				page,
				limit,
				totalCount,
				totalPages,
				hasNextPage: page < totalPages,
				hasPrevPage: page > 1
			}
		});
	} catch (err) {
		console.error('Error fetching projects:', err);
		return json({ error: true, message: 'Failed to fetch projects' }, { status: 500 });
	}
};

// DELETE /api/admin/projects - Delete multiple projects (admin only)
export const DELETE: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user || user.role !== 'Admin') {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { projectIds } = await request.json();

		if (!Array.isArray(projectIds) || projectIds.length === 0) {
			return json({ error: true, message: 'Project IDs are required' }, { status: 400 });
		}

		// Delete projects and all related data
		await prisma.$transaction([
			// Delete files associated with projects
			prisma.file.deleteMany({
				where: { projectId: { in: projectIds } }
			}),
			// Delete messages
			prisma.message.deleteMany({
				where: { projectId: { in: projectIds } }
			}),
			// Delete tasks
			prisma.task.deleteMany({
				where: { projectId: { in: projectIds } }
			}),
			// Finally delete the projects
			prisma.project.deleteMany({
				where: { id: { in: projectIds } }
			})
		]);

		return json({ success: true, message: `${projectIds.length} project(s) deleted successfully` });
	} catch (err) {
		console.error('Error deleting projects:', err);
		return json({ error: true, message: 'Failed to delete projects' }, { status: 500 });
	}
};

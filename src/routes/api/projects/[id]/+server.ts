import type { RequestHandler } from '@sveltejs/kit';
import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

// GET /api/projects/[id] - Get a specific project
export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}

	const projectId = params.id;
	if (!projectId) {
		return json({ error: true, message: 'Project ID is required' }, { status: 400 });
	}
	try {
		const project = await prisma.project.findFirst({
			where: {
				id: projectId,
				members: {
					some: { userId: user.id }
				}
			},
			include: {
				tasks: {
					orderBy: {
						createdAt: 'desc'
					},
					include: {
						file: true
					}
				},
				files: {
					orderBy: {
						uploadedAt: 'desc'
					}
				},
				messages: {
					orderBy: {
						createdAt: 'desc'
					},
					include: {
						user: {
							select: {
								id: true,
								name: true,
								profilePictureUrl: true
							}
						}
					}
				},
				members: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								profilePictureUrl: true
							}
						}
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
		});

		if (!project) {
			return json({ error: true, message: 'Project not found' }, { status: 404 });
		}

		// Get current user's role in the project
		const currentUserMembership = project.members.find(member => member.userId === user.id);
		const userRole = currentUserMembership?.role || 'Member';

		return json({ 
			success: true, 
			project: {
				...project,
				currentUserRole: userRole
			}
		});
	} catch (err) {
		console.error('Error fetching project:', err);
		return json({ error: true, message: 'Failed to fetch project' }, { status: 500 });
	}
};

// PUT /api/projects/[id] - Update a project
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}

	const projectId = params.id;
	if (!projectId) {
		return json({ error: true, message: 'Project ID is required' }, { status: 400 });
	}

	try {
		const { name, description } = await request.json();

		if (!name || name.trim() === '') {
			return json({ error: true, message: 'Project name is required' }, { status: 400 });
		}

		// Check if project exists and user is a member
		const existingProject = await prisma.project.findFirst({
			where: {
				id: projectId,
				members: {
					some: { userId: user.id, role: 'Admin' }
				}
			}
		});

		if (!existingProject) {
			return json({ error: true, message: 'Project not found' }, { status: 404 });
		}

		const project = await prisma.project.update({
			where: {
				id: projectId
			},
			data: {
				name: name.trim(),
				description: description?.trim() || null
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
		return json({ success: true, project });
	} catch (err) {
		console.error('Error updating project:', err);
		return json({ error: true, message: 'Failed to update project' }, { status: 500 });
	}
};

// DELETE /api/projects/[id] - Delete a project
export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}

	const projectId = params.id;
	if (!projectId) {
		return json({ error: true, message: 'Project ID is required' }, { status: 400 });
	}
	try {
		// Check if project exists and user is an Admin member
		const existingProject = await prisma.project.findFirst({
			where: {
				id: projectId,
				members: {
					some: { userId: user.id, role: 'Admin' }
				}
			},
			include: {
				_count: {
					select: {
						tasks: true,
						files: true,
						messages: true,
						members: true
					}
				}
			}
		});

		if (!existingProject) {
			// Check if project exists but user doesn't have admin access
			const projectExists = await prisma.project.findFirst({
				where: {
					id: projectId,
					members: {
						some: { userId: user.id }
					}
				}
			});

			if (projectExists) {
				return json({ error: true, message: 'Insufficient permissions. Only project admins can delete projects.' }, { status: 403 });
			}

			return json({ error: true, message: 'Project not found' }, { status: 404 });
		}

		// Delete all related data first (due to foreign key constraints)
		await prisma.$transaction([
			// Delete project members
			prisma.projectMember.deleteMany({
				where: { projectId }
			}),
			// Delete files associated with tasks in this project
			prisma.file.deleteMany({
				where: {
					projectId: projectId
				}
			}),
			// Delete tasks
			prisma.task.deleteMany({
				where: {
					projectId: projectId
				}
			}),
			// Delete messages
			prisma.message.deleteMany({
				where: {
					projectId: projectId
				}
			}),
			// Finally delete the project
			prisma.project.delete({
				where: {
					id: projectId
				}
			})
		]);

		return json({ 
			success: true, 
			message: 'Project deleted successfully',
			deletedCounts: {
				tasks: existingProject._count.tasks,
				files: existingProject._count.files,
				messages: existingProject._count.messages,
				members: existingProject._count.members
			}
		});
	} catch (err) {
		console.error('Error deleting project:', err);
		return json({ error: true, message: 'Failed to delete project' }, { status: 500 });
	}
};

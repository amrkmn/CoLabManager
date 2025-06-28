import { getPublicURL, uploadToS3 } from '$lib/server/minio';
import { prisma } from '$lib/server/prisma';
import { realtimeBroadcaster } from '$lib/server/realtime';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { ulid } from 'ulid';

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

	// Check if user is a member of the project (either owner or collaborator)
	const projectMembership = await prisma.projectMember.findFirst({
		where: {
			projectId: projectId,
			userId: user.id
		},
		include: {
			project: true
		}
	});

	if (!projectMembership) {
		return json({ error: true, message: 'Project not found or access denied' }, { status: 404 });
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
						avatar: true
					}
				}
			}
		}); // Transform the response to match the expected format
		const transformedTasks = tasks.map((task) => ({
			id: task.id,
			title: task.title,
			description: task.description,
			status: task.status.toLowerCase().replace('inprogress', 'in-progress'), // Convert enum to lowercase with hyphen
			priority: task.priority === 1 ? 'low' : task.priority === 2 ? 'medium' : 'high',
			projectId: task.projectId,
			createdAt: task.createdAt.toISOString(),
			updatedAt: task.updatedAt.toISOString(),
			user: {
				id: task.user.id,
				name: task.user.name,
				avatar: task.user.avatar
			},
			files: task.file.map((file) => ({
				id: file.id,
				name: file.name,
				path: getPublicURL(file.path),
				uploadedAt: file.uploadedAt.toISOString()
			}))
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
	// Check if user is a member of the project (either owner or collaborator)
	const projectMembership = await prisma.projectMember.findFirst({
		where: {
			projectId: projectId,
			userId: user.id
		},
		include: {
			project: true
		}
	});

	if (!projectMembership) {
		return json({ error: true, message: 'Project not found or access denied' }, { status: 404 });
	}

	// Check if user has permission to create tasks (admin check if needed)
	// For now, all project members can create tasks
	const project = projectMembership.project;
	try {
		let title = '',
			description = '',
			status = 'todo',
			priority = 'medium',
			file = null;
		const contentType = request.headers.get('content-type') || '';
		if (contentType.includes('multipart/form-data')) {
			const formData = await request.formData();
			title = (formData.get('title') as string) || '';
			description = (formData.get('description') as string) || '';
			status = (formData.get('status') as string) || 'todo';
			priority = (formData.get('priority') as string) || 'medium';
			file = formData.get('file');
		} else {
			const body = await request.json();
			title = body.title || '';
			description = body.description || '';
			status = body.status || 'todo';
			priority = body.priority || 'medium';
		}

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

		// Handle file upload if present
		let createdTask;
		if (file && typeof File !== 'undefined' && file instanceof File && file.size > 0) {
			const fileName = `projects/${projectId}/tasks/${ulid()}/${file.name}`;
			const buffer = Buffer.from(await file.arrayBuffer());
			await uploadToS3(fileName, buffer, file.type);
			createdTask = await prisma.task.create({
				data: {
					title: title.trim(),
					description: description.trim(),
					status: taskStatus as any,
					priority: taskPriority,
					userId: user.id,
					projectId: projectId,
					file: {
						create: {
							name: file.name,
							path: fileName,
							uploadedBy: user.id,
							projectId: projectId
						}
					}
				},
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
		} else {
			createdTask = await prisma.task.create({
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
							avatar: true
						}
					}
				}
			});
		}
		const transformedTask = {
			id: createdTask.id,
			title: createdTask.title,
			description: createdTask.description,
			status: createdTask.status.toLowerCase().replace('inprogress', 'in-progress'),
			priority: createdTask.priority === 1 ? 'low' : createdTask.priority === 2 ? 'medium' : 'high',
			projectId: createdTask.projectId,
			createdAt: createdTask.createdAt.toISOString(),
			updatedAt: createdTask.updatedAt.toISOString(),
			user: {
				id: createdTask.user.id,
				name: createdTask.user.name,
				avatar: createdTask.user.avatar
			},
			files: createdTask.file.map((file) => {
				return {
					id: file.id,
					name: file.name,
					path: getPublicURL(file.path),
					uploadedAt: file.uploadedAt.toISOString()
				};
			})
		};

		// Broadcast task creation event to other users
		realtimeBroadcaster.broadcastTaskCreated(projectId, transformedTask, user.id);

		return json(transformedTask, { status: 201 });
	} catch (err) {
		console.error('Error creating task:', err);
		return json({ error: true, message: 'Failed to create task' }, { status: 500 });
	}
};

import { prisma } from '$lib/server/prisma';
import { deleteFromS3 } from '$lib/server/minio';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import path from 'path';

const UpdateUserSchema = z.object({
	name: z.string().min(1, 'Name is required').optional(),
	email: z.string().email('Valid email is required').optional(),
	contactNumber: z.string().min(1, 'Contact number is required').optional(),
	role: z.enum(['User', 'Admin']).optional(),
	password: z.string().min(6, 'Password must be at least 6 characters').optional()
});

// GET /api/admin/users/[id] - Get a specific user (admin only)
export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user || user.role !== 'Admin') {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}

	const userId = params.id;
	if (!userId) {
		return json({ error: true, message: 'User ID is required' }, { status: 400 });
	}

	try {
		const targetUser = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				email: true,
				contactNumber: true,
				role: true,
				createdAt: true,
				avatar: true,
				_count: {
					select: {
						projects: true,
						tasks: true,
						files: true,
						messages: true
					}
				}
			}
		});

		if (!targetUser) {
			return json({ error: true, message: 'User not found' }, { status: 404 });
		}

		return json({ success: true, user: targetUser });
	} catch (err) {
		console.error('Error fetching user:', err);
		return json({ error: true, message: 'Failed to fetch user' }, { status: 500 });
	}
};

// PUT /api/admin/users/[id] - Update a user (admin only)
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user || user.role !== 'Admin') {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}

	const userId = params.id;
	if (!userId) {
		return json({ error: true, message: 'User ID is required' }, { status: 400 });
	}

	try {
		const data = await request.json();
		const parsed = UpdateUserSchema.parse(data);

		// Check if user exists
		const existingUser = await prisma.user.findUnique({
			where: { id: userId }
		});

		if (!existingUser) {
			return json({ error: true, message: 'User not found' }, { status: 404 });
		}

		// Check if email is already taken by another user
		if (parsed.email && parsed.email !== existingUser.email) {
			const emailExists = await prisma.user.findUnique({
				where: { email: parsed.email }
			});

			if (emailExists) {
				return json({ error: true, message: 'Email already exists' }, { status: 409 });
			}
		}

		// Prepare update data
		const updateData: any = {};
		if (parsed.name) updateData.name = parsed.name;
		if (parsed.email) updateData.email = parsed.email;
		if (parsed.contactNumber) updateData.contactNumber = parsed.contactNumber;
		if (parsed.role) updateData.role = parsed.role;
		if (parsed.password) updateData.password = await Bun.password.hash(parsed.password);

		// Update user
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: updateData,
			select: {
				id: true,
				name: true,
				email: true,
				contactNumber: true,
				role: true,
				createdAt: true,
				avatar: true
			}
		});

		return json({ success: true, user: updatedUser });
	} catch (err) {
		if (err instanceof z.ZodError) {
			return json({ error: true, message: err.errors[0].message }, { status: 400 });
		}
		console.error('Error updating user:', err);
		return json({ error: true, message: 'Failed to update user' }, { status: 500 });
	}
};

// DELETE /api/admin/users/[id] - Delete a user (admin only)
export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user || user.role !== 'Admin') {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}

	const userId = params.id;
	if (!userId) {
		return json({ error: true, message: 'User ID is required' }, { status: 400 });
	}

	try {
		// Check if user exists and get their data including files
		const existingUser = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				files: true // Get all files uploaded by this user
			}
		});

		if (!existingUser) {
			return json({ error: true, message: 'User not found' }, { status: 404 });
		}

		// Prevent admin from deleting themselves
		if (userId === user.id) {
			return json({ error: true, message: 'Cannot delete your own account' }, { status: 400 });
		}

		// Delete user's profile picture from S3/MinIO if it exists
		if (existingUser.avatar) {
			try {
				// Extract the file path from the URL pattern
				const profilePicturePath = `avatars/${userId}${path.extname(existingUser.avatar)}`;
				await deleteFromS3(profilePicturePath);
			} catch (error) {
				console.error(`Failed to delete profile picture for user ${userId}:`, error);
				// Continue with deletion even if file deletion fails
			}
		}

		// Delete all files uploaded by this user from S3/MinIO
		if (existingUser.files && existingUser.files.length > 0) {
			for (const file of existingUser.files) {
				try {
					await deleteFromS3(file.path);
				} catch (error) {
					console.error(`Failed to delete file ${file.path} for user ${userId}:`, error);
					// Continue with deletion even if file deletion fails
				}
			}
		}

		// Delete user and all related data
		await prisma.$transaction([
			// Delete files associated with user's tasks/projects
			prisma.file.deleteMany({
				where: { uploadedBy: userId }
			}),
			// Delete messages
			prisma.message.deleteMany({
				where: { senderId: userId }
			}),
			// Delete tasks
			prisma.task.deleteMany({
				where: { userId: userId }
			}),
			// Delete projects
			prisma.project.deleteMany({
				where: { createdBy: userId }
			}),
			// Delete sessions
			prisma.session.deleteMany({
				where: { userId: userId }
			}),
			// Finally delete the user
			prisma.user.delete({
				where: { id: userId }
			})
		]);

		return json({ success: true, message: 'User deleted successfully' });
	} catch (err) {
		console.error('Error deleting user:', err);
		return json({ error: true, message: 'Failed to delete user' }, { status: 500 });
	}
};

import { prisma } from '$lib/server/prisma';
import { json } from '@sveltejs/kit';
import * as argon2 from 'argon2';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { getPublicURL } from '$lib/server/minio';
import { isNullish } from '@sapphire/utilities';

// GET /api/admin/users - Get all users (admin only)
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
						{ email: { contains: search, mode: 'insensitive' as const } }
					]
				}
			: {};

		const [users, totalCount] = await Promise.all([
			prisma.user.findMany({
				where,
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' },
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
			}),
			prisma.user.count({ where })
		]);

		const totalPages = Math.ceil(totalCount / limit);

		// Directly modify the users array instead of creating a copy
		users.forEach((user) => {
			user.avatar = isNullish(user.avatar)
				? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`
				: getPublicURL(user.avatar);
		});

		return json({
			success: true,
			users,
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
		console.error('Error fetching users:', err);
		return json({ error: true, message: 'Failed to fetch users' }, { status: 500 });
	}
};

const CreateUserSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().email('Valid email is required'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	contactNumber: z.string().min(1, 'Contact number is required'),
	role: z.enum(['User', 'Admin']).default('User')
});

// POST /api/admin/users - Create a new user (admin only)
export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user || user.role !== 'Admin') {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();
		const parsed = CreateUserSchema.parse(data);

		// Check if email already exists
		const existingUser = await prisma.user.findUnique({
			where: { email: parsed.email }
		});

		if (existingUser) {
			return json({ error: true, message: 'Email already exists' }, { status: 409 });
		}

		// Hash password
		const hashedPassword = await argon2.hash(parsed.password);

		// Create user
		const newUser = await prisma.user.create({
			data: {
				name: parsed.name,
				email: parsed.email,
				password: hashedPassword,
				contactNumber: parsed.contactNumber,
				role: parsed.role
			},
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

		return json({ success: true, user: newUser });
	} catch (err) {
		if (err instanceof z.ZodError) {
			return json({ error: true, message: err.errors[0].message }, { status: 400 });
		}
		console.error('Error creating user:', err);
		return json({ error: true, message: 'Failed to create user' }, { status: 500 });
	}
};

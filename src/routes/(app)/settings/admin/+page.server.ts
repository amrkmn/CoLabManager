import { prisma } from '$lib/server/prisma';
import { isNullish } from '@sapphire/utilities';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const user = locals.user;

	if (isNullish(user)) {
		return redirect(302, '/auth/login');
	}
	if (user.role !== 'Admin') {
		return redirect(302, '/dashboard');
	}

	try {
		// Load initial statistics for the admin dashboard
		const [totalUsers, totalProjects, totalTasks, recentUsers] = await Promise.all([
			prisma.user.count(),
			prisma.project.count(),
			prisma.task.count(),
			prisma.user.findMany({
				take: 5,
				orderBy: { createdAt: 'desc' },
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					createdAt: true
				}
			})
		]);

		return {
			user,
			initialStats: {
				totalUsers,
				totalProjects,
				totalTasks,
				recentUsers
			}
		};
	} catch (err) {
		console.error('Error loading admin data:', err);
		return {
			user,
			initialStats: {
				totalUsers: 0,
				totalProjects: 0,
				totalTasks: 0,
				recentUsers: []
			}
		};
	}
};

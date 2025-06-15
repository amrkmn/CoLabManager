import { prisma } from '$lib/server/prisma';
import { isNullish } from '@sapphire/utilities';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET /api/admin/stats - Get application statistics (admin only)
export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user || user.role !== 'Admin') {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get current date for time-based statistics
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const startOfWeek = new Date(now);
		startOfWeek.setDate(now.getDate() - now.getDay());

		// Aggregate all statistics in parallel
		const [
			totalUsers,
			totalAdmins,
			totalProjects,
			totalTasks,
			totalFiles,
			totalMessages,
			newUsersThisMonth,
			newProjectsThisMonth,
			newTasksThisWeek,
			usersByRole,
			projectsByStatus,
			recentActivity
		] = await Promise.all([
			// Total counts
			prisma.user.count(),
			prisma.user.count({ where: { role: 'Admin' } }),
			prisma.project.count(),
			prisma.task.count(),
			prisma.file.count(),
			prisma.message.count(),

			// Time-based counts
			prisma.user.count({
				where: { createAt: { gte: startOfMonth } }
			}),
			prisma.project.count({
				where: { createdAt: { gte: startOfMonth } }
			}),
			prisma.task.count({
				where: { createdAt: { gte: startOfWeek } }
			}),

			// Grouped statistics
			prisma.user.groupBy({
				by: ['role'],
				_count: { role: true }
			}),

			prisma.task.groupBy({
				by: ['status'],
				_count: { status: true }
			}),

			// Recent activity (last 10 activities across different types)
			Promise.all([
				prisma.user.findMany({
					take: 5,
					orderBy: { createAt: 'desc' },
					select: {
						id: true,
						name: true,
						createAt: true
					}
				}),
				prisma.project.findMany({
					take: 5,
					orderBy: { createdAt: 'desc' },
					include: {
						user: {
							select: { name: true }
						}
					}
				}),
				prisma.task.findMany({
					take: 5,
					orderBy: { createdAt: 'desc' },
					include: {
						user: {
							select: { name: true }
						},
						project: {
							select: { name: true }
						}
					}
				})
			])
		]);

		// Process recent activity
		const [recentUsers, recentProjects, recentTasks] = recentActivity;
		const activityFeed = [
			...recentUsers.map((u) => ({
				type: 'user_created',
				description: `New user "${u.name}" registered`,
				timestamp: u.createAt,
				id: u.id
			})),
			...recentProjects.map((p) => ({
				type: 'project_created',
				description: `Project "${p.name}" created by ${p.user.name}`,
				timestamp: p.createdAt,
				id: p.id
			})),
			...recentTasks.map((t) => ({
				type: 'task_created',
				description: `Task "${t.title}" created in project "${t.project.name}"`,
				timestamp: t.createdAt,
				id: t.id
			}))
		]
			.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
			.slice(0, 10);

		// Calculate growth percentages (simplified - would need historical data for accurate calculations)
		const userGrowthRate = totalUsers > 0 ? Math.round((newUsersThisMonth / totalUsers) * 100) : 0;
		const projectGrowthRate =
			totalProjects > 0 ? Math.round((newProjectsThisMonth / totalProjects) * 100) : 0;

		return json({
			success: true,
			stats: {
				overview: {
					totalUsers,
					totalAdmins,
					totalProjects,
					totalTasks,
					totalFiles,
					totalMessages
				},
				growth: {
					newUsersThisMonth,
					newProjectsThisMonth,
					newTasksThisWeek,
					userGrowthRate,
					projectGrowthRate
				},
				distribution: {
					usersByRole: usersByRole.reduce(
						(acc, item) => {
							acc[item.role] = item._count.role;
							return acc;
						},
						{} as Record<string, number>
					),
					tasksByStatus: projectsByStatus.reduce(
						(acc, item) => {
							acc[item.status] = item._count.status;
							return acc;
						},
						{} as Record<string, number>
					)
				},
				recentActivity: activityFeed
			}
		});
	} catch (err) {
		console.error('Error fetching statistics:', err);
		return json({ error: true, message: 'Failed to fetch statistics' }, { status: 500 });
	}
};

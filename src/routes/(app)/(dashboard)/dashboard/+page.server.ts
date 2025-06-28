import { getPublicURL } from '$lib/server/minio.js';
import { prisma } from '$lib/server/prisma.js';
import { isNullish } from '@sapphire/utilities';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (isNullish(locals.user)) {
		return redirect(302, '/');
	}

	// Get all projects the user is a member of (either as creator or collaborator)
	const projects = await prisma.project.findMany({
		where: {
			members: {
				some: {
					userId: locals.user.id
				}
			}
		},
		include: {
			_count: {
				select: {
					tasks: true,
					files: true,
					messages: true
				}
			},
			members: {
				where: {
					userId: locals.user.id
				},
				select: {
					role: true
				}
			}
		},
		orderBy: {
			createdAt: 'desc'
		}
	});

	const avatar = isNullish(locals.user.avatar)
		? `https://ui-avatars.com/api/?name=${encodeURIComponent(locals.user.name)}`
		: getPublicURL(locals.user.avatar);
	return {
		user: {
			...locals.user,
			avatar
		},
		projects: projects.map((project) => ({
			...project,
			currentUserRole: project.members[0]?.role || 'Member'
		}))
	};
};

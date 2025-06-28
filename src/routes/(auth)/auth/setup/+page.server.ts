import { prisma } from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		throw redirect(302, '/auth/login?error=missing_token');
	}

	const user = await prisma.user.findFirst({
		where: {
			inviteToken: token,
			emailVerified: false
		},
		include: {
			projectMemberships: {
				include: {
					project: { select: { name: true } }
				}
			}
		}
	});

	if (!user) {
		throw redirect(302, '/auth/login?error=invalid_invite');
	}

	return {
		user: {
			email: user.email,
			projects: user.projectMemberships.map((pm) => pm.project.name)
		},
		token
	};
};

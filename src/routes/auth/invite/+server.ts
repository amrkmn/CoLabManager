import { prisma } from '$lib/server/prisma';
import { json, redirect } from '@sveltejs/kit';
import { isSvelteKitRedirect } from '$lib/utils/redirect';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		return json({ error: true, message: 'Invite token is required' }, { status: 400 });
	}

	try {
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
		// Redirect to a setup page where they can complete their profile
		throw redirect(302, `/auth/setup?token=${token}`);
	} catch (error) {
		// Check if this is a SvelteKit redirect - if so, don't log it as an error
		if (isSvelteKitRedirect(error)) {
			throw error; // Re-throw the redirect
		}

		console.error('Invite processing failed:', error);
		return json({ error: true, message: 'Invite processing failed' }, { status: 500 });
	}
};

import { prisma } from '$lib/server/prisma';
import { json, redirect } from '@sveltejs/kit';
import { isSvelteKitRedirect } from '$lib/utils/redirect';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		return json({ error: true, message: 'Verification token is required' }, { status: 400 });
	}

	try {
		const user = await prisma.user.findFirst({
			where: {
				verificationToken: token,
				emailVerified: false
			}
		});

		if (!user) {
			return json(
				{ error: true, message: 'Invalid or expired verification token' },
				{ status: 400 }
			);
		}

		// Update user as verified
		await prisma.user.update({
			where: { id: user.id },
			data: {
				emailVerified: true,
				verificationToken: null
			}
		});

		// Redirect to login with success message
		throw redirect(302, '/auth/login?verified=true');
	} catch (error) {
		// Check if this is a SvelteKit redirect - if so, don't log it as an error
		if (isSvelteKitRedirect(error)) {
			throw error; // Re-throw the redirect
		}

		console.error('Email verification failed:', error);
		return json({ error: true, message: 'Verification failed' }, { status: 500 });
	}
};

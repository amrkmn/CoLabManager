import { deleteSessionTokenCookie, invalidateSession } from '$lib/server/session';
import { isNullish } from '@sapphire/utilities';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, locals }) => {
	const token = cookies.get('session');

	if (!isNullish(token)) {
		try {
			deleteSessionTokenCookie(cookies);
			await invalidateSession(token);
		} catch (error) {}
	}
	locals.session = null;
	locals.user = null;

	return redirect(302, '/auth/login');
};

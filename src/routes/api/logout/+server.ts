import { deleteSessionTokenCookie, deleteSession } from '$lib/server/session';
import { isNullish } from '@sapphire/utilities';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, locals }) => {
	const token = cookies.get('session');

	if (!isNullish(token)) {
		try {
			deleteSessionTokenCookie(cookies);
			const [sessionId] = token.split('.');
			await deleteSession(sessionId);
		} catch (error) {}
	}
	locals.session = null;
	locals.user = null;

	return redirect(302, '/auth/login');
};

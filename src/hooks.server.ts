import { env } from '$env/dynamic/private';
import { runMigrations } from '$lib/server/migrations';
import { log } from '$lib/utils/logger';
import {
	deleteSessionTokenCookie,
	invalidateSession,
	setSessionTokenCookie,
	validateSessionToken
} from './lib/server/session';

import type { Handle } from '@sveltejs/kit';

await runMigrations();

export const handle: Handle = async ({ event, resolve }) => {
	log('env').info(`ORIGIN: ${env.ORIGIN}`);
	const token = event.cookies.get('session') ?? null;
	if (token === null) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await validateSessionToken(token);
	if (session !== null) {
		setSessionTokenCookie(event.cookies, token, session.expiresAt);
	} else {
		await invalidateSession(token);
		deleteSessionTokenCookie(event.cookies);
	}

	event.locals.session = session;

	if (user !== null) {
		const { password, ...userWithoutPassword } = user;
		event.locals.user = userWithoutPassword;
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};

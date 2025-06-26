import { runMigrations } from '$lib/server/migrations';
import { prisma } from '$lib/server/prisma';
import 'dotenv/config';
import {
    deleteSessionTokenCookie,
    setSessionTokenCookie,
    validateSessionToken
} from './lib/server/session';

import type { Handle } from '@sveltejs/kit';

await runMigrations();

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('session') ?? null;
	if (token === null) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const session = await validateSessionToken(token);
	if (session !== null) {
		setSessionTokenCookie(event.cookies, token);

		// Get user data
		const user = await prisma.user.findUnique({
			where: { id: session.userId }
		});

		event.locals.session = session;
		if (user !== null) {
			const { password, ...userWithoutPassword } = user;
			event.locals.user = userWithoutPassword;
		} else {
			event.locals.user = null;
		}
	} else {
		// Session is invalid, clean up
		deleteSessionTokenCookie(event.cookies);
		event.locals.session = null;
		event.locals.user = null;
	}

	return resolve(event);
};

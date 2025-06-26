import { prisma } from '$lib/server/prisma';
import { createSession, setSessionTokenCookie } from '$lib/server/session';
import { isNullish } from '@sapphire/utilities';
import { json } from '@sveltejs/kit';
import * as argon2 from 'argon2';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const Login = z.object({
	email: z.string({ required_error: 'email_required' }).email('email_invalid'),
	password: z.string({ required_error: 'password_required' }).min(6, 'password_too_short')
});

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const data = await request.json();
		const { email, password } = Login.parse(data);

		const user = await prisma.user.findUnique({ where: { email } });

		if (isNullish(user)) {
			return json({ error: true, message: ['invalid_credentials'] }, { status: 401 });
		}

		const validPassword = await argon2.verify(user.password, password);
		if (!validPassword) {
			return json({ error: true, message: ['invalid_credentials'] }, { status: 401 });
		}

		// Check if email is verified
		if (!user.emailVerified) {
			return json({ error: true, message: ['email_not_verified'] }, { status: 403 });
		}

		const { password: _, ...userWithoutPassword } = user;
		const session = await createSession(user.id);
		setSessionTokenCookie(cookies, session.token);

		return json({ user: userWithoutPassword });
	} catch (error) {
		if (error instanceof z.ZodError) {
			const messages = Object.values(error.flatten().fieldErrors).flat();
			return json({ error: true, message: messages }, { status: 400 });
		}

		console.log('Login failed:', error);
		return json({ error: true, message: ['internal_error'] }, { status: 500 });
	}
};

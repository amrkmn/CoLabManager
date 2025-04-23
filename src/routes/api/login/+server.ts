import { z } from 'zod';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma';
import { isNullish } from '@sapphire/utilities';
import { json } from '@sveltejs/kit';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/session';

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

		const validPassword = await Bun.password.verify(password, user.password);
		if (!validPassword) {
			return json({ error: true, message: ['invalid_credentials'] }, { status: 401 });
		}

		const { password: _, ...userWithoutPassword } = user;
		const token = generateSessionToken();
		const session = await createSession(token, user.id);
		setSessionTokenCookie(cookies, token, session.expiresAt);

		return json({ user: userWithoutPassword });
	} catch (error) {
		if (error instanceof z.ZodError) {
			const messages = Object.values(error.flatten().fieldErrors).flat();
			return json({ error: true, message: messages }, { status: 400 });
		}

		return json({ error: true, message: ['internal_error'] }, { status: 500 });
	}
};

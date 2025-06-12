import { prisma } from '$lib/server/prisma';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/session';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const SetupSchema = z.object({
	token: z.string(),
	name: z.string().min(1, 'name_required'),
	password: z.string().min(6, 'password_too_short'),
	contactNumber: z.string().min(1, 'contact_number_required')
});

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const data = await request.json();
		const { token, name, password, contactNumber } = SetupSchema.parse(data);

		// Find user with invite token
		const user = await prisma.user.findFirst({
			where: {
				inviteToken: token,
				emailVerified: false
			}
		});

		if (!user) {
			return json({ error: true, message: ['invalid_token'] }, { status: 400 });
		}

		// Hash password and update user
		const hashedPassword = await Bun.password.hash(password);
		const updatedUser = await prisma.user.update({
			where: { id: user.id },
			data: {
				name,
				password: hashedPassword,
				contactNumber,
				emailVerified: true,
				inviteToken: null
			}
		});

		// Create session and log them in
		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, updatedUser.id);
		setSessionTokenCookie(cookies, sessionToken, session.expiresAt);

		const { password: _, ...userWithoutPassword } = updatedUser;
		return json({ success: true, user: userWithoutPassword });
	} catch (error) {
		if (error instanceof z.ZodError) {
			const messages = Object.values(error.flatten().fieldErrors).flat();
			return json({ error: true, message: messages }, { status: 400 });
		}

		console.error('Setup failed:', error);
		return json({ error: true, message: ['internal_error'] }, { status: 500 });
	}
};

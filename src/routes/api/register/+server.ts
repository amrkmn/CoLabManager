import { env } from '$env/dynamic/private';
import { generateVerificationEmailHtml, sendEmail } from '$lib/server/email';
import { prisma } from '$lib/server/prisma';
import { isFirstUserSetup } from '$lib/server/setup';
import { isNullish } from '@sapphire/utilities';
import { json } from '@sveltejs/kit';
import * as argon2 from "argon2";
import { randomUUID } from 'crypto';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const Register = z.object({
	name: z.string({ required_error: 'name_required' }),
	email: z.string({ required_error: 'email_required' }).email('email_invalid'),
	password: z.string({ required_error: 'password_required' }).min(6, 'password_too_short'),
	contactNumber: z.string({ required_error: 'contact_number_required' })
});

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const { name, email, password, contactNumber } = Register.parse(data);

		const checkUser = await prisma.user.findUnique({ where: { email } });
		if (!isNullish(checkUser)) {
			return json({ error: true, message: ['email_already_used'] }, { status: 409 });
		}

		// Check if this is the first user (setup mode)
		const isFirstUser = await isFirstUserSetup();

		const hashedPassword = await argon2.hash(password);
		const verificationToken = randomUUID();

		await prisma.user.create({
			data: {
				name,
				email,
				contactNumber,
				password: hashedPassword,
				verificationToken,
				emailVerified: false,
				// Make first user an admin
				role: isFirstUser ? 'Admin' : 'User'
			}
		});
		// Send verification email
		const verificationUrl = `${env.ORIGIN || 'http://localhost:5173'}/auth/verify?token=${verificationToken}`;
		await sendEmail({
			to: email,
			subject: 'Verify your email - CoLab Manager',
			html: generateVerificationEmailHtml(name, verificationUrl)
		});

		const message = isFirstUser
			? 'Admin account created! Please check your email to verify your account and complete the setup.'
			: 'Registration successful! Please check your email to verify your account.';

		return json({
			success: true,
			message,
			isFirstUser
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			const formatted = Object.values(error.flatten().fieldErrors).flat();
			return json({ error: true, message: formatted }, { status: 400 });
		}

		return json({ error: true, message: ['internal_error'] }, { status: 500 });
	}
};

import { prisma } from '$lib/server/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { json, type RequestHandler } from '@sveltejs/kit';
import argon2 from 'argon2';
import { z } from 'zod';

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

		const hashedPassword = await argon2.hash(password);

		const user = await prisma.user.create({
			data: {
				name,
				email,
				contactNumber,
				password: hashedPassword
			}
		});

		return json(user);
	} catch (error) {
		if (error instanceof z.ZodError) {
			const formatted = error.flatten();
			return json({ error: true, message: formatted.fieldErrors }, { status: 400 });
		}
		if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
			return json({ error: true, message: 'email_already_used' }, { status: 400 });
		}

		return json({ error: true, message: String(error) });
	}
};

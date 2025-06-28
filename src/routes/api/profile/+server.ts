import { deleteFromS3, getPublicURL, uploadToS3 } from '$lib/server/minio';
import { prisma } from '$lib/server/prisma';
import { isNullish } from '@sapphire/utilities';
import { json } from '@sveltejs/kit';
import * as argon2 from 'argon2';
import { get } from 'http';
import path from 'path';
import { z } from 'zod';

const UpdateProfile = z.object({
	name: z.string(),
	email: z.string().email(),
	password: z.string().optional(),
	contactNumber: z.string(),
	profilePicture: z.any().optional()
});

export const GET = async ({ locals }) => {
	if (isNullish(locals.user)) {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}

	const user = await prisma.user.findUnique({
		where: { id: locals.user.id },
		select: { name: true, email: true, contactNumber: true, role: true, avatar: true }
	});

	return json(user);
};

export const PUT = async ({ request, locals }) => {
	if (isNullish(locals.user)) {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}

	const formData = await request.formData();
	const name = formData.get('name') as string;
	const email = formData.get('email') as string;
	const password = (formData.get('password') as string) || undefined;
	const contactNumber = formData.get('contactNumber') as string;
	const profilePicture = (formData.get('profilePicture') as File) || undefined;

	const parsed = UpdateProfile.parse({
		name,
		email,
		password,
		contactNumber,
		profilePicture
	});

	let avatar: string | undefined;

	// If a new profile picture is being uploaded, handle the old one
	if (profilePicture && profilePicture.size > 0) {
		// Get current user to check for existing profile picture
		const currentUser = await prisma.user.findUnique({
			where: { id: locals.user.id },
			select: { avatar: true }
		});

		const fileName = `avatars/${locals.user.id}${path.extname(profilePicture.name)}`;
		const fileBuffer = Buffer.from(await profilePicture.arrayBuffer());

		// Delete old profile picture if it exists
		if (currentUser?.avatar) {
			try {
				// Extract the file path from the URL
				const oldPath = `avatars/${locals.user.id}${path.extname(currentUser.avatar)}`;
				await deleteFromS3(oldPath);
			} catch (error) {
				console.error('Failed to delete old profile picture:', error);
				// Continue with upload even if deletion fails
			}
		}

		await uploadToS3(fileName, fileBuffer, profilePicture.type);
		avatar = getPublicURL(fileName);
	}

	await prisma.user.update({
		where: { id: locals.user.id },
		data: {
			name: parsed.name,
			email: parsed.email,
			contactNumber: parsed.contactNumber,
			...(parsed.password && { password: await argon2.hash(parsed.password) }),
			...(avatar && { avatar })
		}
	});

	return json({ success: true });
};

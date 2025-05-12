import { prisma } from '$lib/server/prisma';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { isNullish } from '@sapphire/utilities';
import { getPublicURL, MinioClient, uploadToMinIO } from '$lib/server/minio'; // Assuming you have a MinIO client setup
import { randomUUID } from 'crypto';
import { createId } from '@paralleldrive/cuid2';
import path from 'path';

const UpdateProfile = z.object({
	name: z.string(),
	email: z.string().email(),
	password: z.string().optional(),
	contactNumber: z.string(),
	profilePicture: z.any().optional() // Allow profile picture as an optional field
});

export const GET = async ({ locals }) => {
	if (isNullish(locals.user)) {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}

	const user = await prisma.user.findUnique({
		where: { id: locals.user.id },
		select: { name: true, email: true, contactNumber: true, role: true, profilePictureUrl: true }
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
	const password = formData.get('password') as string | null;
	const contactNumber = formData.get('contactNumber') as string;
	const profilePicture = formData.get('profilePicture') as File | null;

	// Validate the input
	const parsed = UpdateProfile.parse({
		name,
		email,
		password,
		contactNumber,
		profilePicture
	});

	let profilePictureUrl: string | undefined;

	// Handle profile picture upload to MinIO
	if (profilePicture) {
		const fileName = `${locals.user.id}/${createId()}.${path.extname(profilePicture.name)}`;
		const fileBuffer = Buffer.from(await profilePicture.arrayBuffer());

		uploadToMinIO(fileName, fileBuffer, profilePicture.type);

		// Generate the URL for the uploaded file
		profilePictureUrl = getPublicURL(fileName);
	}

	// Update the user in the database
	await prisma.user.update({
		where: { id: locals.user.id },
		data: {
			name: parsed.name,
			email: parsed.email,
			contactNumber: parsed.contactNumber,
			...(parsed.password && { password: await Bun.password.hash(parsed.password) }),
			...(profilePictureUrl && { profilePicture: profilePictureUrl })
		}
	});

	return json({ success: true });
};

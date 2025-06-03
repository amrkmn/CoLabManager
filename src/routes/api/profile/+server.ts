import { getPublicURL, uploadToS3 } from '$lib/server/minio'; // Assuming you have a MinIO client setup
import { prisma } from '$lib/server/prisma';
import { createId } from '@paralleldrive/cuid2';
import { isNullish } from '@sapphire/utilities';
import { json } from '@sveltejs/kit';
import path from 'path';
import { z } from 'zod';

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
	const password = (formData.get('password') as string) || undefined;
	const contactNumber = formData.get('contactNumber') as string;
	const profilePicture = (formData.get('profilePicture') as File) || undefined;

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
	if (profilePicture && profilePicture.size > 0) {
		const fileName = `${locals.user.id}/pfp/image${path.extname(profilePicture.name)}`;
		const fileBuffer = Buffer.from(await profilePicture.arrayBuffer());

		await uploadToS3(fileName, fileBuffer, profilePicture.type);

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
			...(profilePictureUrl && { profilePictureUrl })
		}
	});

	return json({ success: true });
};

import type { RequestHandler } from '@sveltejs/kit';
import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { uploadToS3 } from '$lib/server/minio';
import { createId } from '@paralleldrive/cuid2';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const formData = await request.formData();
	const text = formData.get('text')?.toString() || '';
	const columnId = formData.get('columnId')?.toString() || '';
	const file = formData.get('file') as File | null;

	if (!text && !file) {
		throw error(400, 'Task text or file is required.');
	}
	if (!columnId) {
		throw error(400, 'Column ID is required.');
	}

	let filePath: string | null = null;
	let fileName: string | null = null;
	let fileType: string | null = null;

	if (file) {
		const uploadResult = await uploadToS3(
			createId(),
			Buffer.from(await file.arrayBuffer()),
			file.type
		);
		filePath = uploadResult;
		fileName = file.name;
		fileType = file.type;

		// const addedFile = await prisma.file.create({
		// 	data: {
		// 		name: fileName,
		// 		path: filePath,
		// 		uploadedBy: user.id,
		// 	}
		// });
		// const task = await prisma.task.create({
		// 	data: {
		// 		text,
		// 		file
		// 	}
		// });
	}

	return json({ success: true, task: {} });
};

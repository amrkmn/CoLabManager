// DEPRECATED: This endpoint is deprecated. Use /api/projects/[id]/tasks instead.
// This file will be removed in a future version.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	return json(
		{
			error: true,
			message: 'This endpoint is deprecated. Please use /api/projects/[id]/tasks instead.'
		},
		{ status: 410 }
	);
};

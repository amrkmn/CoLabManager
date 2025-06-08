// DEPRECATED: This endpoint is deprecated. Use /api/projects/tasks/[taskId] instead.
// This file will be removed in a future version.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async () => {
	return json(
		{
			error: true,
			message: 'This endpoint is deprecated. Please use /api/projects/tasks/[taskId] instead.'
		},
		{ status: 410 }
	);
};

export const DELETE: RequestHandler = async () => {
	return json(
		{
			error: true,
			message: 'This endpoint is deprecated. Please use /api/projects/tasks/[taskId] instead.'
		},
		{ status: 410 }
	);
};

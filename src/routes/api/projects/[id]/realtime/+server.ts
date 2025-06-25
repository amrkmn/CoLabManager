import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { realtimeBroadcaster } from '$lib/server/realtime';
import { prisma } from '$lib/server/prisma';
import { randomUUID } from 'crypto';

export const GET: RequestHandler = async ({ params, locals, request }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}

	const projectId = params.id;
	if (!projectId) {
		return json({ error: true, message: 'Project ID is required' }, { status: 400 });
	}

	// Verify user has access to this project
	const projectMembership = await prisma.projectMember.findFirst({
		where: {
			projectId: projectId,
			userId: user.id
		}
	});

	if (!projectMembership) {
		return json({ error: true, message: 'Project not found or access denied' }, { status: 404 });
	}

	// Create SSE stream
	const stream = new ReadableStream({
		start(controller) {
			const connectionId = randomUUID();

			// Add connection to broadcaster
			realtimeBroadcaster.addConnection({
				id: connectionId,
				controller,
				projectId,
				userId: user.id
			});

			// Send initial connection message
			const encoder = new TextEncoder();
			const initialData = encoder.encode(
				`data: ${JSON.stringify({
					type: 'connected',
					projectId,
					timestamp: Date.now(),
					connectionId
				})}\n\n`
			);
			controller.enqueue(initialData);

			// Send periodic heartbeat to keep connection alive
			const heartbeat = setInterval(() => {
				try {
					const heartbeatData = encoder.encode(
						`data: ${JSON.stringify({
							type: 'heartbeat',
							timestamp: Date.now()
						})}\n\n`
					);
					controller.enqueue(heartbeatData);
				} catch (error) {
					clearInterval(heartbeat);
					realtimeBroadcaster.removeConnection(connectionId);
				}
			}, 30000); // 30 seconds

			// Handle connection close
			request.signal.addEventListener('abort', () => {
				clearInterval(heartbeat);
				realtimeBroadcaster.removeConnection(connectionId);
				controller.close();
			});
		}
	});

	// Set headers for SSE
	const headers = new Headers();
	headers.set('Content-Type', 'text/event-stream');
	headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
	headers.set('Connection', 'keep-alive');
	headers.set('X-Accel-Buffering', 'no');
	headers.set('Pragma', 'no-cache');
	headers.set('Expires', '0');

	return new Response(stream, { headers });
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { realtimeBroadcaster } from '$lib/server/realtime';
import { prisma } from '$lib/server/prisma';
import { ulid } from 'ulid';

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
			const connectionId = ulid();

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

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': 'Cache-Control'
		}
	});
};

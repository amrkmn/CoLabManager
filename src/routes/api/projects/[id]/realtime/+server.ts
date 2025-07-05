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

	// Check if this is a WebSocket upgrade request
	const upgradeHeader = request.headers.get('upgrade');
	const connectionHeader = request.headers.get('connection');
	
	if (upgradeHeader?.toLowerCase() === 'websocket' && 
		connectionHeader?.toLowerCase().includes('upgrade')) {
		
		// For WebSocket upgrade, we need to handle it at the server level
		// Return a special response that will be handled by the server
		return new Response('WebSocket upgrade endpoint', {
			status: 426,
			headers: {
				'Upgrade': 'websocket',
				'Connection': 'Upgrade',
				'X-Project-Id': projectId,
				'X-User-Id': user.id
			}
		});
	}

	// Fallback to SSE for backward compatibility
	const stream = new ReadableStream({
		start(controller) {
			const connectionId = randomUUID();

			// For SSE, we need to create a mock WebSocket interface
			const mockWebSocket = {
				readyState: 1, // OPEN
				send: (data: string) => {
					try {
						const encoder = new TextEncoder();
						const eventData = `data: ${data}\n\n`;
						const encodedData = encoder.encode(eventData);
						controller.enqueue(encodedData);
					} catch (error) {
						console.error('Error sending SSE message:', error);
					}
				},
				close: () => {
					try {
						controller.close();
					} catch (error) {
						// Controller might already be closed
					}
				},
				addEventListener: () => {},
				removeEventListener: () => {},
				ping: () => {} // Mock ping for SSE
			} as any;

			// Add connection to broadcaster with mock WebSocket
			realtimeBroadcaster.addConnection({
				id: connectionId,
				socket: mockWebSocket,
				projectId,
				userId: user.id,
				lastPing: Date.now()
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
				try {
					controller.close();
				} catch (error) {
					// Controller might already be closed
				}
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

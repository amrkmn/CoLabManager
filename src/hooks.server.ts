import { runMigrations } from '$lib/server/migrations';
import { prisma } from '$lib/server/prisma';
import 'dotenv/config';
import {
    deleteSessionTokenCookie,
    setSessionTokenCookie,
    validateSessionToken
} from './lib/server/session';
import { realtimeBroadcaster } from '$lib/server/realtime';
import { randomUUID } from 'crypto';
import { WebSocketServer } from 'ws';
import type { Handle } from '@sveltejs/kit';

await runMigrations();

// Create WebSocket server for real-time connections
let wsServer: WebSocketServer | null = null;

// Initialize WebSocket server after first request
function initWebSocketServer() {
	if (wsServer) return;
	
	try {
		// Create WebSocket server on a different port or handle upgrades
		wsServer = new WebSocketServer({ 
			port: 3001,
			path: '/ws',
			verifyClient: async (info: any) => {
				// Extract project ID and user ID from query parameters
				const url = new URL(info.req.url || '', `http://${info.req.headers.host}`);
				const projectId = url.searchParams.get('projectId');
				const sessionToken = url.searchParams.get('session');
				
				if (!projectId || !sessionToken) {
					return false;
				}

				// Validate session
				const session = await validateSessionToken(sessionToken);
				if (!session) {
					return false;
				}

				// Verify user has access to project
				const projectMembership = await prisma.projectMember.findFirst({
					where: {
						projectId: projectId,
						userId: session.userId
					}
				});

				if (!projectMembership) {
					return false;
				}

				// Store auth info for connection handler
				(info.req as any).userId = session.userId;
				(info.req as any).projectId = projectId;
				
				return true;
			}
		});

		wsServer.on('connection', (ws, req) => {
			const userId = (req as any).userId;
			const projectId = (req as any).projectId;
			const connectionId = randomUUID();

			console.log(`WebSocket connection established for user ${userId} in project ${projectId}`);

			// Add connection to broadcaster
			realtimeBroadcaster.addConnection({
				id: connectionId,
				socket: ws as any, // Cast to match our interface
				projectId,
				userId,
				lastPing: Date.now()
			});

			// Send initial connection message
			ws.send(JSON.stringify({
				type: 'connected',
				projectId,
				timestamp: Date.now(),
				connectionId
			}));

			// Handle incoming messages (for bidirectional communication)
			ws.on('message', (data) => {
				try {
					const message = JSON.parse(data.toString());
					console.log('Received WebSocket message:', message);
					
					// Handle different message types
					if (message.type === 'ping') {
						ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
					}
					// Add more message handlers as needed
				} catch (error) {
					console.error('Error handling WebSocket message:', error);
				}
			});

			// Handle connection close
			ws.on('close', () => {
				console.log(`WebSocket connection closed for user ${userId} in project ${projectId}`);
				realtimeBroadcaster.removeConnection(connectionId);
			});

			// Handle errors
			ws.on('error', (error) => {
				console.error('WebSocket error:', error);
				realtimeBroadcaster.removeConnection(connectionId);
			});
		});

		wsServer.on('error', (error) => {
			console.error('WebSocket server error:', error);
		});

		console.log('WebSocket server started on port 3001');
	} catch (error) {
		console.error('Failed to start WebSocket server:', error);
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	// Initialize WebSocket server on first request
	if (!wsServer) {
		initWebSocketServer();
	}

	const token = event.cookies.get('session') ?? null;
	if (token === null) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const session = await validateSessionToken(token);
	if (session !== null) {
		setSessionTokenCookie(event.cookies, token);

		// Get user data
		const user = await prisma.user.findUnique({
			where: { id: session.userId }
		});

		event.locals.session = session;
		if (user !== null) {
			const { password, ...userWithoutPassword } = user;
			event.locals.user = userWithoutPassword;
		} else {
			event.locals.user = null;
		}
	} else {
		// Session is invalid, clean up
		deleteSessionTokenCookie(event.cookies);
		event.locals.session = null;
		event.locals.user = null;
	}

	return resolve(event);
};

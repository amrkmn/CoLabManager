// WebSocket broadcaster for real-time updates
import type { WebSocket as WSWebSocket } from 'ws';

type EventType = 'task_created' | 'task_updated' | 'task_deleted' | 'task_moved';

interface RealtimeEvent {
	type: EventType;
	projectId: string;
	data: any;
	timestamp: number;
	userId: string;
}

interface WebSocketConnection {
	id: string;
	socket: WSWebSocket;
	projectId: string;
	userId: string;
	lastPing?: number;
}

class RealtimeBroadcaster {
	private connections = new Map<string, WebSocketConnection>();

	addConnection(connection: WebSocketConnection) {
		this.connections.set(connection.id, connection);
		
		// Set up ping/pong for connection health
		connection.socket.on('pong', () => {
			connection.lastPing = Date.now();
		});
		
		// Handle connection close
		connection.socket.on('close', () => {
			this.removeConnection(connection.id);
		});
		
		// Handle connection errors
		connection.socket.on('error', () => {
			this.removeConnection(connection.id);
		});
	}

	removeConnection(connectionId: string) {
		const connection = this.connections.get(connectionId);
		if (connection) {
			// Close WebSocket if still open
			if (connection.socket.readyState === connection.socket.OPEN) {
				connection.socket.close();
			}
			this.connections.delete(connectionId);
		}
	}

	broadcast(event: RealtimeEvent) {
		const eventData = JSON.stringify(event);

		// Send to all connections for the same project, except the originating user
		for (const [connectionId, connection] of this.connections) {
			if (connection.projectId === event.projectId && connection.userId !== event.userId) {
				try {
					if (connection.socket.readyState === connection.socket.OPEN) {
						connection.socket.send(eventData);
					} else {
						// Remove stale connection
						this.removeConnection(connectionId);
					}
				} catch (error) {
					console.error('Error sending WebSocket message:', error);
					// Remove broken connection
					this.removeConnection(connectionId);
				}
			}
		}
	}

	// Broadcast task creation
	broadcastTaskCreated(projectId: string, task: any, userId: string) {
		this.broadcast({
			type: 'task_created',
			projectId,
			data: { task },
			timestamp: Date.now(),
			userId
		});
	}

	// Broadcast task update
	broadcastTaskUpdated(projectId: string, task: any, userId: string) {
		this.broadcast({
			type: 'task_updated',
			projectId,
			data: { task },
			timestamp: Date.now(),
			userId
		});
	}

	// Broadcast task deletion
	broadcastTaskDeleted(projectId: string, taskId: string, userId: string) {
		this.broadcast({
			type: 'task_deleted',
			projectId,
			data: { taskId },
			timestamp: Date.now(),
			userId
		});
	}

	// Broadcast task moved (status change)
	broadcastTaskMoved(projectId: string, task: any, userId: string) {
		this.broadcast({
			type: 'task_moved',
			projectId,
			data: { task },
			timestamp: Date.now(),
			userId
		});
	}

	getConnectionCount(projectId?: string): number {
		if (projectId) {
			return Array.from(this.connections.values()).filter((conn) => conn.projectId === projectId)
				.length;
		}
		return this.connections.size;
	}

	// Send heartbeat to all connections to check health
	sendHeartbeat() {
		const heartbeatData = JSON.stringify({
			type: 'heartbeat',
			timestamp: Date.now()
		});

		for (const [connectionId, connection] of this.connections) {
			try {
				if (connection.socket.readyState === connection.socket.OPEN) {
					connection.socket.ping();
					connection.socket.send(heartbeatData);
				} else {
					this.removeConnection(connectionId);
				}
			} catch (error) {
				console.error('Error sending heartbeat:', error);
				this.removeConnection(connectionId);
			}
		}
	}
}

// Global broadcaster instance
export const realtimeBroadcaster = new RealtimeBroadcaster();

// Set up periodic heartbeat to maintain connections and detect dead ones
if (typeof setInterval !== 'undefined') {
	setInterval(() => {
		realtimeBroadcaster.sendHeartbeat();
	}, 30000); // 30 seconds
}

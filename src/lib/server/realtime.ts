// Server-sent events broadcaster for real-time updates
type EventType = 'task_created' | 'task_updated' | 'task_deleted' | 'task_moved';

interface RealtimeEvent {
	type: EventType;
	projectId: string;
	data: any;
	timestamp: number;
	userId: string;
}

interface SSEConnection {
	id: string;
	controller: ReadableStreamDefaultController;
	projectId: string;
	userId: string;
}

class RealtimeBroadcaster {
	private connections = new Map<string, SSEConnection>();

	addConnection(connection: SSEConnection) {
		this.connections.set(connection.id, connection);
	}

	removeConnection(connectionId: string) {
		this.connections.delete(connectionId);
	}

	broadcast(event: RealtimeEvent) {
		const encoder = new TextEncoder();
		const eventData = `data: ${JSON.stringify(event)}\n\n`;
		const encodedData = encoder.encode(eventData);

		// Send to all connections for the same project, except the originating user
		for (const [connectionId, connection] of this.connections) {
			if (connection.projectId === event.projectId && connection.userId !== event.userId) {
				try {
					connection.controller.enqueue(encodedData);
				} catch (error) {
					console.error('Error sending SSE message:', error);
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
}

// Global broadcaster instance
export const realtimeBroadcaster = new RealtimeBroadcaster();

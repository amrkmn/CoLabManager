import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface RealtimeEvent {
	type: 'task_created' | 'task_updated' | 'task_deleted' | 'task_moved' | 'connected' | 'heartbeat';
	projectId?: string;
	data?: any;
	timestamp: number;
	connectionId?: string;
}

class RealtimeStore {
	private connection: WebSocket | EventSource | null = null;
	private projectId: string | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectInterval = 5000;
	private useWebSocket = true; // Prefer WebSocket over SSE
	
	public events = writable<RealtimeEvent | null>(null);
	public connected = writable(false);
	public error = writable<string | null>(null);

	connect(projectId: string) {
		if (!browser) return;

		// Close existing connection
		this.disconnect();

		this.projectId = projectId;
		this.reconnectAttempts = 0;
		this.error.set(null);

		this.attemptConnection();
	}

	private attemptConnection() {
		if (!this.projectId) return;

		if (this.useWebSocket) {
			this.connectWebSocket();
		} else {
			this.connectSSE();
		}
	}

	private connectWebSocket() {
		if (!this.projectId) return;

		try {
			// Get session token from cookies
			const sessionToken = document.cookie
				.split('; ')
				.find(row => row.startsWith('session='))
				?.split('=')[1];

			if (!sessionToken) {
				console.error('No session token found for WebSocket connection');
				this.useWebSocket = false;
				this.connectSSE();
				return;
			}

			// Determine the WebSocket URL - connect to the WebSocket server
			const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
			const wsPort = window.location.hostname === 'localhost' ? ':3001' : ':3001'; // Adjust for production
			const wsUrl = `${protocol}//${window.location.hostname}${wsPort}/ws?projectId=${this.projectId}&session=${sessionToken}`;
			
			const ws = new WebSocket(wsUrl);
			this.connection = ws;

			ws.onopen = () => {
				console.log('WebSocket connected to project:', this.projectId);
				this.connected.set(true);
				this.error.set(null);
				this.reconnectAttempts = 0;
			};

			ws.onmessage = (event) => {
				try {
					const data: RealtimeEvent = JSON.parse(event.data);

					// Skip heartbeat messages
					if (data.type === 'heartbeat') {
						return;
					}

					console.log('WebSocket event received:', data);
					this.events.set(data);
				} catch (err) {
					console.error('Error parsing WebSocket message:', err);
				}
			};

			ws.onclose = (event) => {
				console.log('WebSocket closed:', event.code, event.reason);
				this.connected.set(false);
				
				// If close was not clean, try to reconnect or fallback to SSE
				if (event.code !== 1000) {
					if (this.reconnectAttempts < this.maxReconnectAttempts) {
						this.handleReconnect();
					} else {
						// Fallback to SSE after max reconnect attempts
						console.log('WebSocket max reconnects reached, falling back to SSE');
						this.useWebSocket = false;
						this.connectSSE();
					}
				}
			};

			ws.onerror = (event) => {
				console.error('WebSocket error:', event);
				this.connected.set(false);
				this.error.set('WebSocket connection error');
				
				// Fallback to SSE on WebSocket error
				console.log('WebSocket error, falling back to SSE');
				this.useWebSocket = false;
				this.connectSSE();
			};

		} catch (error) {
			console.error('Failed to create WebSocket:', error);
			// Fallback to SSE if WebSocket creation fails
			this.useWebSocket = false;
			this.connectSSE();
		}
	}

	private connectSSE() {
		if (!this.projectId) return;

		try {
			const eventSource = new EventSource(`/api/projects/${this.projectId}/realtime`);
			this.connection = eventSource;

			eventSource.onopen = () => {
				console.log('SSE connected to project:', this.projectId);
				this.connected.set(true);
				this.error.set(null);
				this.reconnectAttempts = 0;
			};

			eventSource.onmessage = (event) => {
				try {
					const data: RealtimeEvent = JSON.parse(event.data);

					// Skip heartbeat messages
					if (data.type === 'heartbeat') {
						return;
					}

					console.log('SSE event received:', data);
					this.events.set(data);
				} catch (err) {
					console.error('Error parsing SSE message:', err);
				}
			};

			eventSource.onerror = (event) => {
				console.error('SSE error:', event);
				this.connected.set(false);
				
				if (eventSource.readyState === EventSource.CLOSED) {
					this.handleReconnect();
				}
			};

		} catch (error) {
			console.error('Failed to create EventSource:', error);
			this.error.set('Failed to establish connection');
		}
	}

	private handleReconnect() {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			this.error.set('Maximum reconnection attempts reached');
			return;
		}

		this.reconnectAttempts++;
		this.error.set(`Connection lost. Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

		setTimeout(() => {
			if (this.projectId) {
				this.attemptConnection();
			}
		}, this.reconnectInterval * this.reconnectAttempts);
	}

	disconnect() {
		if (this.connection) {
			if (this.connection instanceof WebSocket) {
				this.connection.close(1000, 'Client disconnecting');
			} else if (this.connection instanceof EventSource) {
				this.connection.close();
			}
			this.connection = null;
			this.connected.set(false);
			this.projectId = null;
		}
	}

	// Send message via WebSocket (bidirectional communication)
	send(message: any): boolean {
		if (this.connection instanceof WebSocket && this.connection.readyState === WebSocket.OPEN) {
			this.connection.send(JSON.stringify(message));
			return true;
		}
		console.warn('Cannot send message: WebSocket not connected');
		return false;
	}

	// Test bidirectional communication
	testBidirectional(): Promise<boolean> {
		return new Promise((resolve) => {
			if (!(this.connection instanceof WebSocket) || this.connection.readyState !== WebSocket.OPEN) {
				resolve(false);
				return;
			}

			const testMessage = {
				type: 'echo',
				testData: 'bidirectional test',
				timestamp: Date.now()
			};

			const timeout = setTimeout(() => {
				resolve(false);
			}, 5000);

			const handleMessage = (event: MessageEvent) => {
				try {
					const data = JSON.parse(event.data);
					if (data.type === 'echo_response' && data.originalMessage.testData === testMessage.testData) {
						clearTimeout(timeout);
						this.connection!.removeEventListener('message', handleMessage);
						resolve(true);
					}
				} catch (error) {
					// Ignore parsing errors for other messages
				}
			};

			this.connection.addEventListener('message', handleMessage);
			this.connection.send(JSON.stringify(testMessage));
		});
	}

	// Get connection type for debugging
	getConnectionType(): 'websocket' | 'sse' | 'disconnected' {
		if (!this.connection) return 'disconnected';
		if (this.connection instanceof WebSocket) return 'websocket';
		return 'sse';
	}

	// Check if bidirectional communication is available
	isBidirectional(): boolean {
		return this.connection instanceof WebSocket && this.connection.readyState === WebSocket.OPEN;
	}
}

export const realtimeStore = new RealtimeStore();

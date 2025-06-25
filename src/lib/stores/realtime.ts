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
	private eventSource: EventSource | null = null;
	private projectId: string | null = null;
	public events = writable<RealtimeEvent | null>(null);
	public connected = writable(false);
	public error = writable<string | null>(null);

	connect(projectId: string) {
		if (!browser) return;

		// Close existing connection
		this.disconnect();

		this.projectId = projectId;
		this.eventSource = new EventSource(`/api/projects/${projectId}/realtime`);

		this.eventSource.onopen = () => {
			console.log('SSE connected to project:', projectId);
			this.connected.set(true);
			this.error.set(null);
		};

		this.eventSource.onmessage = (event) => {
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

		this.eventSource.onerror = (event) => {
			console.error('SSE error:', event);
			this.connected.set(false);
			this.error.set('Connection lost. Attempting to reconnect...');

			if (this.eventSource?.readyState === EventSource.CLOSED) {
				setTimeout(() => {
					if (this.projectId) {
						this.connect(this.projectId);
					}
				}, 5000);
			}
		};
	}

	disconnect() {
		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = null;
			this.connected.set(false);
			this.projectId = null;
		}
	}
}

export const realtimeStore = new RealtimeStore();

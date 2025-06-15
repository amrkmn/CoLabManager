/**
 * Format a date to include both date and time
 * @param date - Date string or Date object
 * @returns Formatted date string with time
 */
export function formatDateTime(date: string | Date): string {
	const dateObj = typeof date === 'string' ? new Date(date) : date;

	return dateObj.toLocaleString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: true
	});
}

/**
 * Format a relative time (e.g., "2 hours ago")
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date): string {
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

	const intervals = {
		year: 31536000,
		month: 2592000,
		week: 604800,
		day: 86400,
		hour: 3600,
		minute: 60
	};

	for (const [unit, seconds] of Object.entries(intervals)) {
		const interval = Math.floor(diffInSeconds / seconds);
		if (interval >= 1) {
			return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
		}
	}

	return 'Just now';
}

/**
 * Format a date in a compact format suitable for UI
 * @param date - Date string or Date object
 * @returns Compact formatted date string
 */
export function formatCompactDateTime(date: string | Date): string {
	const dateObj = typeof date === 'string' ? new Date(date) : date;

	return dateObj.toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: true
	});
}

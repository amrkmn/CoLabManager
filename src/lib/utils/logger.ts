/**
 * Simple logger utility for the PTA application
 */

import { env } from "$env/dynamic/private";

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
	debug: (message: string) => void;
	info: (message: string) => void;
	warn: (message: string) => void;
	error: (message: string) => void;
}

function formatMessage(level: LogLevel, context: string, message: string): string {
	const timestamp = new Date().toISOString();
	const levelUpper = level.toUpperCase().padEnd(5);
	return `[${timestamp}] ${levelUpper} [${context}] ${message}`;
}

export function log(context: string): Logger {
	return {
		debug: (message: string) => {
			if (env.NODE_ENV === 'development') {
				console.log(formatMessage('debug', context, message));
			}
		},
		info: (message: string) => {
			console.log(formatMessage('info', context, message));
		},
		warn: (message: string) => {
			console.warn(formatMessage('warn', context, message));
		},
		error: (message: string) => {
			console.error(formatMessage('error', context, message));
		}
	};
}

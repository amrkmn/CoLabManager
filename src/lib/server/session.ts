import { env } from '$env/dynamic/private';
import { prisma } from '$lib/server/prisma';
import { isNullish } from '@sapphire/utilities';
import type { Cookies } from '@sveltejs/kit';
import ms from 'ms';

interface Session {
	id: string;
	userId: string;
	secretHash: Uint8Array;
	createdAt: Date;
	lastVerifiedAt: Date;
}

interface SessionWithToken extends Session {
	token: string;
}

const inactivityTimeout = ms('10d');
const activityCheckInterval = ms('1h');

function generateSecureRandomString(): string {
	const alphabet = 'abcdefghijklmnpqrstuvwxyz23456789';

	const bytes = new Uint8Array(24);
	crypto.getRandomValues(bytes);

	let id = '';
	for (let i = 0; i < bytes.length; i++) {
		id += alphabet[bytes[i] >> 3];
	}
	return id;
}

export async function createSession(userId: string): Promise<SessionWithToken> {
	const now = new Date();

	const id = generateSecureRandomString();
	const secret = generateSecureRandomString();
	const secretHash = await hashSecret(secret);

	const token = `${id}.${secret}`;

	const session: SessionWithToken = {
		id,
		userId,
		secretHash,
		createdAt: now,
		lastVerifiedAt: now,
		token
	};

	await prisma.session.create({
		data: {
			id: session.id,
			userId: session.userId,
			secretHash: session.secretHash,
			createdAt: session.createdAt,
			lastVerifiedAt: now
		}
	});
	return session;
}

export async function validateSessionToken(token: string): Promise<Session | null> {
	const now = new Date();

	const [sessionId, sessionSecret] = token.split('.');
	if (!sessionId || !sessionSecret) {
		return null;
	}
	const session = await prisma.session.findUnique({
		where: { id: sessionId }
	});

	if (!session) {
		return null;
	}

	const tokenSecretHash = await hashSecret(sessionSecret);
	const isValidSecret = constantTimeEqual(session.secretHash, tokenSecretHash);
	if (!isValidSecret) {
		return null;
	}

	if (now.getTime() - session.lastVerifiedAt.getTime() >= activityCheckInterval) {
		session.lastVerifiedAt = now;
		await prisma.session.update({ where: { id: session.id }, data: { lastVerifiedAt: now } });
	}

	return session;
}

export async function getSession(sessionId: string): Promise<Session | null> {
	const now = new Date();

	const session = await prisma.session.findUnique({
		where: { id: sessionId }
	});
	if (isNullish(session)) {
		throw null;
	}

	if (now.getTime() - session.createdAt.getTime() >= inactivityTimeout) {
		await deleteSession(sessionId);
		return null;
	}

	return session;
}

export async function deleteSession(sessionId: string): Promise<void> {
	await prisma.session.delete({ where: { id: sessionId } });
}

export function setSessionTokenCookie(cookies: Cookies, token: string): void {
	cookies.set('session', token, {
		httpOnly: true,
		sameSite: 'lax',
		maxAge: ms('1d') / 1000, // Convert to seconds as required by Set-Cookie
		path: '/',
		secure: env.NODE_ENV === 'production'
	});
}

export function deleteSessionTokenCookie(cookies: Cookies): void {
	cookies.delete('session', {
		path: '/'
	});
}

async function hashSecret(secret: string): Promise<Uint8Array> {
	const secretBytes = new TextEncoder().encode(secret);
	const secretHashBuffer = await crypto.subtle.digest('SHA-256', secretBytes);
	return new Uint8Array(secretHashBuffer);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.byteLength !== b.byteLength) {
		return false;
	}
	let c = 0;
	for (let i = 0; i < a.byteLength; i++) {
		c |= a[i] ^ b[i];
	}
	return c === 0;
}

export async function getSessionWithUser(sessionId: string) {
	const session = await getSession(sessionId);
	if (!session) {
		return { session: null, user: null };
	}

	const user = await prisma.user.findUnique({
		where: { id: session.userId }
	});

	return { session, user };
}

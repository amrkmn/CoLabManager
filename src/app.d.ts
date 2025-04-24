// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Session, User } from '@prisma/client';

declare global {
	namespace App {
		interface Locals {
			user: Omit<User, 'password'> | null;
			session: Session | null;
		}
	}
}

export {};

import { redirect } from '@sveltejs/kit';
import { isFirstUserSetup } from '$lib/server/setup';

export const load = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, '/dashboard');
	}

	// Check if this is first-time setup
	const isFirstUser = await isFirstUserSetup();
	if (isFirstUser) {
		throw redirect(302, '/auth/register');
	}

	throw redirect(302, '/auth/login');
};

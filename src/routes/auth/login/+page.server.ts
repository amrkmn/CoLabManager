import { isNullish } from '@sapphire/utilities';
import { redirect } from '@sveltejs/kit';
import { isFirstUserSetup } from '$lib/server/setup';

export async function load({ locals }) {
	// Check if user is already logged in
	if (!isNullish(locals.user)) {
		return redirect(302, '/dashboard');
	}
	
	// If no users exist yet, redirect to registration for setup
	const isFirstUser = await isFirstUserSetup();
	if (isFirstUser) {
		throw redirect(302, '/auth/register');
	}
	
	return {};
}

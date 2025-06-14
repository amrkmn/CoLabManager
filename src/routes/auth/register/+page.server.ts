import { isFirstUserSetup } from '$lib/server/setup';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const isFirstUser = await isFirstUserSetup();
	
	// If this is not the first user, and we want to disable public registration,
	// we can redirect to login. For now, we'll allow public registration.
	// Uncomment the following lines if you want to disable public registration:
	// if (!isFirstUser) {
	//     throw redirect(302, '/auth/login?error=registration_disabled');
	// }
	
	return {
		isFirstUser
	};
};

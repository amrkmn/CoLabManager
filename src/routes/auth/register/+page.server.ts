import { isFirstUserSetup } from '$lib/server/setup';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const isFirstUser = await isFirstUserSetup();

	if (!isFirstUser) {
		throw redirect(302, '/auth/login');
	}

	return {
		isFirstUser
	};
};

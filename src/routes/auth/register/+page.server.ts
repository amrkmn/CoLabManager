import { isFirstUserSetup } from '$lib/server/setup';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const isFirstUser = await isFirstUserSetup();

	return {
		isFirstUser
	};
};

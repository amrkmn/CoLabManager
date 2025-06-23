import { isFirstUserSetup } from '$lib/server/setup';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const isFirstUser = await isFirstUserSetup();

	return {
		isFirstUser
	};
};

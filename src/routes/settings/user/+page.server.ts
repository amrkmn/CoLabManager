import { isNullish } from '@sapphire/utilities';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const user = locals.user;

	if (isNullish(user)) {
		return redirect(302, '/auth/login');
	}

	return { user: locals.user };
};

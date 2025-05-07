import { isNullish } from '@sapphire/utilities';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const user = locals.user;

	if (isNullish(user)) {
		return redirect(302, '/auth/login');
	}
	if (user.role !== 'Admin') {
		return redirect(302, '/dashboard');
	}

	return { user: locals.user };
};

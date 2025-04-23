import { isNullish } from '@sapphire/utilities';
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	if (isNullish(locals.user)) {
		return redirect(302, '/login');
	}

	return {
		user: locals.user
	};
}

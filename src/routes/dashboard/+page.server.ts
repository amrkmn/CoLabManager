import { isNullish } from '@sapphire/utilities';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (isNullish(locals.user)) {
		return redirect(302, '/');
	}

	const { id, name, email, contactNumber, role, createAt } = locals.user;
	return {
		user: { id, name, email, contactNumber, role, createAt }
	};
};

import { redirect } from '@sveltejs/kit';

export const load = ({ locals }) => {
	if (locals.user) {
		throw redirect(302, '/dashboard');
	}

	throw redirect(302, '/login');
};

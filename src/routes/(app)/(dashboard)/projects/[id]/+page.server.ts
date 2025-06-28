import { getPublicURL } from '$lib/server/minio';
import { isNullish } from '@sapphire/utilities';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (isNullish(locals.user)) {
		return redirect(302, '/');
	}

	const avatar = isNullish(locals.user.avatar)
		? `https://ui-avatars.com/api/?name=${encodeURIComponent(locals.user.name)}`
		: getPublicURL(locals.user.avatar);
	return {
		user: {
			...locals.user,
			avatar
		}
	};
};

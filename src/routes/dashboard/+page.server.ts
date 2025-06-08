import { prisma } from '$lib/server/prisma.js';
import { isNullish } from '@sapphire/utilities';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (isNullish(locals.user)) {
		return redirect(302, '/');
	}
	const projects = await prisma.project.findMany({ where: { createdBy: locals.user.id } });

	return {
		user: locals.user,
		projects
	};
};

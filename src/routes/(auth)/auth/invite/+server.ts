import { prisma } from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, locals }) => {
	const token = url.searchParams.get('token');
	const action = url.searchParams.get('action');
	const user = locals.user;

	if (!token || !action) {
		throw redirect(303, '/dashboard?error=Invalid invitation link.');
	}

	try {
		const invitation = await prisma.invitation.findUnique({
			where: { token, status: 'Pending' }
		});

		if (!invitation) {
			throw redirect(303, '/dashboard?error=Invalid or expired invitation.');
		}

		if (action === 'decline') {
			await prisma.invitation.update({
				where: { id: invitation.id },
				data: { status: 'Denied', respondedAt: new Date() }
			});
			throw redirect(303, '/dashboard?message=Invitation declined');
		}

		if (action === 'accept') {
			if (!user) {
				const redirectTo = `/auth/invite?token=${token}&action=accept`;
				throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
			}

			if (user.email !== invitation.email) {
				throw redirect(303, '/dashboard?error=This invitation is for a different user.');
			}

			await prisma.$transaction(async (tx) => {
				await tx.invitation.update({
					where: { id: invitation.id },
					data: { status: 'Accepted', respondedAt: new Date() }
				});

				await tx.projectMember.create({
					data: {
						userId: user.id,
						projectId: invitation.projectId,
						role: invitation.role
					}
				});
			});

			throw redirect(303, `/projects/${invitation.projectId}`);
		} else {
			throw redirect(303, '/dashboard?error=Invalid action.');
		}
	} catch (err: any) {
		if (err.status === 303) {
			throw err;
		}
		console.error('Error responding to invitation:', err);
		throw redirect(303, '/dashboard?error=Failed to respond to invitation.');
	}
};

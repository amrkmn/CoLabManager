import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

// DELETE /api/projects/[id]/members/[userId] - Remove a user from a project
export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}

	const projectId = params.id;
	const userId = params.userId;

	if (!projectId || !userId) {
		return json({ error: true, message: 'Project ID and User ID are required' }, { status: 400 });
	}

	try {
		// Only allow if user is an admin of the project
		const adminMembership = await prisma.projectMember.findFirst({
			where: { projectId, userId: user.id, role: 'Admin' }
		});

		if (!adminMembership) {
			return json(
				{ error: true, message: 'Only project admins can remove members' },
				{ status: 403 }
			);
		}

		// Don't allow removing yourself
		if (userId === user.id) {
			return json(
				{ error: true, message: 'You cannot remove yourself from the project' },
				{ status: 400 }
			);
		}

		// Check if the member exists
		const memberToRemove = await prisma.projectMember.findFirst({
			where: { projectId, userId }
		});

		if (!memberToRemove) {
			return json({ error: true, message: 'Member not found in this project' }, { status: 404 });
		}

		// Remove the member
		await prisma.projectMember.delete({
			where: { userId_projectId: { userId, projectId } }
		});

		return json({ success: true, message: 'Member removed successfully' });
	} catch (err) {
		console.error('Error removing project member:', err);
		return json({ error: true, message: 'Failed to remove project member' }, { status: 500 });
	}
};

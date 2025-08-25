import { env } from '$env/dynamic/private';
import { generateProjectInviteEmailHtml, sendEmail } from '$lib/server/email';
import { getPublicURL } from '$lib/server/minio';
import { prisma } from '$lib/server/prisma';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';

// GET /api/projects/[id]/members - List all members of a project
export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}
	const projectId = params.id;
	if (!projectId) {
		return json({ error: true, message: 'Project ID is required' }, { status: 400 });
	}
	try {
		// Only allow if user is a member
		const membership = await prisma.projectMember.findFirst({
			where: { projectId, userId: user.id }
		});
		if (!membership) {
			return json({ error: true, message: 'Forbidden' }, { status: 403 });
		}
		const members = await prisma.projectMember.findMany({
			where: { projectId },
			include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
		});
		const membersWithAvatar = members.map((m) => ({
			...m,
			user: {
				...m.user,
				avatar: !m.user.avatar
					? `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user.name)}`
					: getPublicURL(m.user.avatar)
			}
		}));
		return json({ success: true, members: membersWithAvatar });
	} catch (err) {
		console.error('Error fetching project members:', err);
		return json({ error: true, message: 'Failed to fetch project members' }, { status: 500 });
	}
};

// POST /api/projects/[id]/members - Invite a user to a project
export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}
	const projectId = params.id;
	if (!projectId) {
		return json({ error: true, message: 'Project ID is required' }, { status: 400 });
	}
	try {
		const { email, role } = await request.json();
		if (!email) {
			return json({ error: true, message: 'User email is required' }, { status: 400 });
		}

		const project = await prisma.project.findUnique({
			where: { id: projectId },
			include: { user: { select: { name: true } } }
		});

		if (!project) {
			return json({ error: true, message: 'Project not found' }, { status: 404 });
		}

		const adminMembership = await prisma.projectMember.findFirst({
			where: { projectId, userId: user.id, role: 'Admin' }
		});
		if (!adminMembership) {
			return json({ error: true, message: 'Forbidden' }, { status: 403 });
		}

		const existingInvite = await prisma.invitation.findFirst({
			where: {
				projectId,
				email,
				status: {
					in: ['Pending']
				}
			}
		});

		if (existingInvite) {
			return json(
				{ error: true, message: 'An active invitation for this user already exists.' },
				{ status: 409 }
			);
		}

		const inviteToken = randomUUID();
		const inviteUrl = `${env.ORIGIN || 'http://localhost:5173'}/auth/invite?token=${inviteToken}`;

		const invitation = await prisma.invitation.create({
			data: {
				projectId,
				email,
				role: role || 'Member',
				token: inviteToken
			}
		});

		await sendEmail({
			to: email,
			subject: `You've been invited to join ${project.name} - CoLab Manager`,
			html: generateProjectInviteEmailHtml(user.name, project.name, inviteUrl, role || 'Member')
		});

		return json({
			success: true,
			invitation,
			message: 'Invitation sent successfully.'
		});
	} catch (err) {
		console.error('Error sending invitation:', err);
		return json({ error: true, message: 'Failed to send invitation' }, { status: 500 });
	}
};

// DELETE /api/projects/[id]/members/[userId] - Remove a user from a project
export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}
	const projectId = params.id;
	const memberId = params.userId;
	if (!projectId || !memberId) {
		return json({ error: true, message: 'Project ID and User ID are required' }, { status: 400 });
	}
	try {
		const adminMembership = await prisma.projectMember.findFirst({
			where: { projectId, userId: user.id, role: 'Admin' }
		});
		if (!adminMembership) {
			return json({ error: true, message: 'Forbidden' }, { status: 403 });
		}
		await prisma.projectMember.delete({
			where: { userId_projectId: { userId: memberId, projectId } }
		});
		return json({ success: true });
	} catch (err) {
		console.error('Error removing project member:', err);
		return json({ error: true, message: 'Failed to remove project member' }, { status: 500 });
	}
};

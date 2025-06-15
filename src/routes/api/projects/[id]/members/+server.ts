import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { sendEmail, generateProjectInviteEmailHtml } from '$lib/server/email';
import { createId } from '@paralleldrive/cuid2';
import { env } from '$env/dynamic/private';

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
			include: { user: { select: { id: true, name: true, email: true, profilePictureUrl: true } } }
		});
		return json({ success: true, members });
	} catch (err) {
		console.error('Error fetching project members:', err);
		return json({ error: true, message: 'Failed to fetch project members' }, { status: 500 });
	}
};

// POST /api/projects/[id]/members - Add a user to a project
export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: true, message: 'Unauthorized' }, { status: 401 });
	}
	const projectId = params.id;
	if (!projectId) {
		return json({ error: true, message: 'Project ID is required' }, { status: 400 });
	}	try {
		const { email, role } = await request.json();
		if (!email) {
			return json({ error: true, message: 'User email is required' }, { status: 400 });
		}
		
		// Get project details for email
		const project = await prisma.project.findUnique({
			where: { id: projectId },
			include: { user: { select: { name: true } } }
		});
		
		if (!project) {
			return json({ error: true, message: 'Project not found' }, { status: 404 });
		}
		
		// Only allow if user is an admin of the project
		const adminMembership = await prisma.projectMember.findFirst({
			where: { projectId, userId: user.id, role: 'Admin' }
		});
		if (!adminMembership) {
			return json({ error: true, message: 'Forbidden' }, { status: 403 });
		}
		
		const targetUser = await prisma.user.findUnique({ where: { email } });
		
		if (targetUser) {
			// User exists, check if already a member
			const existingMember = await prisma.projectMember.findUnique({
				where: { userId_projectId: { userId: targetUser.id, projectId } }
			});
			
			if (existingMember) {
				return json({ error: true, message: 'User is already a member of this project' }, { status: 409 });
			}
			
			// Add member directly
			const member = await prisma.projectMember.create({
				data: {
					userId: targetUser.id,
					projectId,
					role: role || 'Member'
				}
			});
			
			// Send notification email
			const inviteUrl = `${env.ORIGIN || 'http://localhost:5173'}/projects/${projectId}`;
			await sendEmail({
				to: email,
				subject: `You've been added to ${project.name} - PTA`,
				html: generateProjectInviteEmailHtml(user.name, project.name, inviteUrl, role || 'Member')
			});
			
			return json({ success: true, member, message: 'User added to project and notified via email' });
		} else {
			// User doesn't exist, create invite token
			const inviteToken = createId();
			const inviteUrl = `${env.ORIGIN || 'http://localhost:5173'}/auth/invite?token=${inviteToken}`;
			
			// Store invite details in a temporary way (you might want to create a separate table for this)
			// For now, we'll create a user record with invite token
			const hashedPassword = await Bun.password.hash(createId()); // temporary password
			const newUser = await prisma.user.create({
				data: {
					name: email.split('@')[0], // temporary name
					email,
					password: hashedPassword,
					contactNumber: '', // will be filled on first login
					emailVerified: false,
					inviteToken,
					role: 'User'
				}
			});
			
			// Add as project member
			const member = await prisma.projectMember.create({
				data: {
					userId: newUser.id,
					projectId,
					role: role || 'Member'
				}
			});
			
			// Send invitation email
			await sendEmail({
				to: email,
				subject: `You've been invited to join ${project.name} - PTA`,
				html: generateProjectInviteEmailHtml(user.name, project.name, inviteUrl, role || 'Member')
			});
			
			return json({ success: true, member, message: 'Invitation sent via email' });
		}
	} catch (err) {
		console.error('Error adding project member:', err);
		return json({ error: true, message: 'Failed to add project member' }, { status: 500 });
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
		// Only allow if user is an admin of the project
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

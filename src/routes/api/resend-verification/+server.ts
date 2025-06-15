import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { sendEmail, generateVerificationEmailHtml } from '$lib/server/email';
import { createId } from '@paralleldrive/cuid2';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const user = locals.user;

		// Check if user is authenticated
		if (!user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is already verified
		if (user.emailVerified) {
			return json(
				{
					success: false,
					error: 'Email is already verified'
				},
				{ status: 400 }
			);
		}

		// Generate new verification token
		const verificationToken = createId();

		// Update user with new verification token
		await prisma.user.update({
			where: { id: user.id },
			data: { verificationToken }
		});
		// Send verification email
		const baseUrl = env.ORIGIN || 'http://localhost:5173';
		const verificationUrl = `${baseUrl}/auth/verify?token=${verificationToken}`;

		const emailResult = await sendEmail({
			to: user.email,
			subject: 'Verify Your Email - CoLab Manager',
			html: generateVerificationEmailHtml(user.name, verificationUrl),
			text: `Hello ${user.name},\n\nPlease verify your email by visiting: ${verificationUrl}\n\nThis link will expire in 24 hours.`
		});

		if (!emailResult.success) {
			console.error('Failed to send verification email:', emailResult.error);
			return json(
				{
					success: false,
					error: 'Failed to send verification email. Please try again later.'
				},
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: 'Verification email sent successfully. Please check your inbox.'
		});
	} catch (error) {
		console.error('Resend verification error:', error);
		return json(
			{
				success: false,
				error: 'Internal server error'
			},
			{ status: 500 }
		);
	}
};

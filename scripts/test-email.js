#!/usr/bin/env bun
/**
 * Test Email Script
 *
 * This script allows you to test email sending functionality
 * Usage: bun run scripts/test-email.js [email] [type]
 *
 * Examples:
 * bun run scripts/test-email.js test@example.com verification
 * bun run scripts/test-email.js test@example.com invitation
 * bun run scripts/test-email.js test@example.com basic
 */

import {
	sendEmail,
	generateVerificationEmailHtml,
	generateProjectInviteEmailHtml
} from '../src/lib/server/email.js';

const args = process.argv.slice(2);
const email = args[0];
const type = args[1] || 'basic';

if (!email) {
	console.error('❌ Please provide an email address');
	console.log('Usage: bun run scripts/test-email.js [email] [type]');
	console.log('Types: basic, verification, invitation');
	process.exit(1);
}

console.log(`📧 Testing email sending to: ${email}`);
console.log(`📝 Email type: ${type}`);
console.log('⏳ Sending email...\n');

async function testEmail() {
	try {
		let result;

		switch (type) {
			case 'verification':
				result = await sendEmail({
					to: email,
					subject: 'Test Email Verification - CoLab Manager',
					html: generateVerificationEmailHtml(
						'Test User',
						'http://localhost:5173/auth/verify?token=TEST_TOKEN'
					),
					text: 'This is a test verification email. Please verify your email by visiting the link provided.'
				});
				break;

			case 'invitation':
				result = await sendEmail({
					to: email,
					subject: 'Test Project Invitation - CoLab Manager',
					html: generateProjectInviteEmailHtml(
						'John Doe',
						'Test Project',
						'http://localhost:5173/auth/invite?token=TEST_INVITE_TOKEN',
						'Member'
					),
					text: 'You have been invited to join a test project on CoLab Manager.'
				});
				break;
			case 'basic':
			default:
				result = await sendEmail({
					to: email,
					subject: 'Test Email - CoLab Manager',
					html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h1 style="color: #2563eb; text-align: center;">Email Test Successful! 🎉</h1>
                            <p>This is a test email from CoLab Manager.</p>
                            <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
                            <p><strong>Environment:</strong> ${Bun.env.NODE_ENV || 'development'}</p>
                            <div style="background-color: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p><strong>SMTP Configuration:</strong></p>
                                <ul>
                                    <li>Host: ${Bun.env.SMTP_HOST || 'smtp.gmail.com'}</li>
                                    <li>Port: ${Bun.env.SMTP_PORT || '587'}</li>
                                    <li>Secure: ${Bun.env.SMTP_SECURE || 'false'}</li>
                                    <li>User: ${Bun.env.SMTP_USER || 'Not configured'}</li>
                                </ul>
                            </div>
                            <p>If you received this email, your email configuration is working correctly!</p>
                            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px;">
                                <p>&copy; 2025 CoLab Manager. All rights reserved.</p>
                                <p><a href="%%UNSUBSCRIBE%%" style="color: #999; font-size: 11px; text-decoration: underline;">Unsubscribe from future emails</a></p>
                            </div>
                        </div>
                    `,
					text: `Email Test Successful!\n\nThis is a test email from CoLab Manager.\nSent at: ${new Date().toLocaleString()}\n\nIf you received this email, your email configuration is working correctly!\n\nUnsubscribe: %%UNSUBSCRIBE%%`
				});
				break;
		}

		if (result.success) {
			console.log('✅ Email sent successfully!');
			console.log(`📬 Message ID: ${result.messageId}`);
			console.log(`📤 Sent to: ${email}`);
			console.log(`📧 Type: ${type}`);
		} else {
			console.error('❌ Failed to send email');
			console.error('Error:', result.error);
		}
	} catch (error) {
		console.error('💥 Script error:', error);
		process.exit(1);
	}
}

// Check environment variables
console.log('🔧 Environment Check:');
console.log(`SMTP_HOST: ${Bun.env.SMTP_HOST || '❌ Not set (using default: smtp.gmail.com)'}`);
console.log(`SMTP_PORT: ${Bun.env.SMTP_PORT || '❌ Not set (using default: 587)'}`);
console.log(`SMTP_USER: ${Bun.env.SMTP_USER || '❌ Not set'}`);
console.log(`SMTP_PASS: ${Bun.env.SMTP_PASS ? '✅ Set' : '❌ Not set'}`);
console.log(`EMAIL_FROM: ${Bun.env.EMAIL_FROM || '❌ Not set'}`);
console.log(
	`EMAIL_FROM_NAME: ${Bun.env.EMAIL_FROM_NAME || '❌ Not set (using default: CoLab Manager)'}`
);
console.log('');

if (!Bun.env.SMTP_USER || !Bun.env.SMTP_PASS) {
	console.warn('⚠️  Warning: SMTP credentials are not configured. Email sending will likely fail.');
	console.log('Please set SMTP_USER and SMTP_PASS in your .env file');
	console.log('');
}

testEmail();

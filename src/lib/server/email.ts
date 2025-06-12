import nodemailer from 'nodemailer';

/**
 * Email Service for CoLab Manager
 *
 * Features:
 * - SMTP configuration with environment variables
 * - List-Unsubscribe header support for SMTP2GO compliance
 * - %%UNSUBSCRIBE%% placeholder support (handled by SMTP2GO)
 * - HTML and text email templates
 */

// Email configuration from environment variables
const transporter = nodemailer.createTransport({
	host: Bun.env.SMTP_HOST || 'smtp.gmail.com',
	port: parseInt(Bun.env.SMTP_PORT || '587'),
	secure: Bun.env.SMTP_SECURE === 'true', // true for 465, false for other ports
	auth: {
		user: Bun.env.SMTP_USER,
		pass: Bun.env.SMTP_PASS
	}
});

export interface EmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

export async function sendEmail(options: EmailOptions) {
	try {
		const mailOptions = {
			from: `"${Bun.env.EMAIL_FROM_NAME || 'CoLab Manager'}" <${Bun.env.EMAIL_FROM || Bun.env.SMTP_USER}>`,
			to: options.to,
			subject: options.subject,
			html: options.html,
			text: options.text,
			headers: {
				'List-Unsubscribe': '%%UNSUBSCRIBE%%',
				'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
			}
		};

		const info = await transporter.sendMail(mailOptions);

		console.log('Email sent:', info.messageId);
		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error('Email sending failed:', error);
		return { success: false, error };
	}
}

export function generateVerificationEmailHtml(name: string, verificationUrl: string) {
	return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .button { 
                    display: inline-block; 
                    background-color: #2563eb; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    margin: 20px 0;                }
                .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                .unsubscribe { color: #999; font-size: 11px; text-decoration: underline; }
                .unsubscribe:hover { color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to CoLab Manager!</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name},</h2>
                    <p>Thank you for registering with CoLab Manager. To complete your registration and start using the application, please verify your email address by clicking the button below:</p>
                    <div style="text-align: center;">
                        <a href="${verificationUrl}" class="button" style="color: white">Verify Email Address</a>
                    </div>
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
                    <p>This verification link will expire in 24 hours.</p>                    <p>If you didn't create an account with us, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 CoLab Manager. All rights reserved.</p>
                    <p><a href="%%UNSUBSCRIBE%%" class="unsubscribe">Unsubscribe from future emails</a></p>
                </div>
            </div>
        </body>
        </html>
    `;
}

export function generateProjectInviteEmailHtml(
	inviterName: string,
	projectName: string,
	inviteUrl: string,
	role: string
) {
	return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .button { 
                    display: inline-block; 
                    background-color: #2563eb; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    margin: 20px 0; 
                }                .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                .unsubscribe { color: #999; font-size: 11px; text-decoration: underline; }
                .unsubscribe:hover { color: #666; }
                .project-info {
                    background-color: white; 
                    padding: 15px; 
                    border-left: 4px solid #2563eb; 
                    margin: 15px 0; 
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Project Invitation</h1>
                </div>
                <div class="content">
                    <h2>You've been invited to collaborate!</h2>
                    <p><strong>${inviterName}</strong> has invited you to join a project on CoLab Manager.</p>
                    
                    <div class="project-info">
                        <h3>Project: ${projectName}</h3>
                        <p><strong>Role:</strong> ${role}</p>
                    </div>
                    
                    <p>Click the button below to accept the invitation and start collaborating:</p>
                    <div style="text-align: center;">
                        <a href="${inviteUrl}" class="button">Accept Invitation</a>
                    </div>
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #2563eb;">${inviteUrl}</p>
                    <p>This invitation link will expire in 7 days.</p>                    <p>If you don't have a CoLab Manager account yet, you'll be prompted to create one first.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 CoLab Manager. All rights reserved.</p>
                    <p><a href="%%UNSUBSCRIBE%%" class="unsubscribe">Unsubscribe from future emails</a></p>
                </div>
            </div>
        </body>
        </html>
    `;
}

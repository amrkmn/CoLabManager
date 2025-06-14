import { prisma } from './prisma';

/**
 * Check if this is the first user registration (setup mode)
 * Returns true if no users exist in the system
 */
export async function isFirstUserSetup(): Promise<boolean> {
	try {
		const userCount = await prisma.user.count();
		return userCount === 0;
	} catch (error) {
		console.error('Error checking first user setup:', error);
		return false;
	}
}

/**
 * Check if the application has been set up
 * Returns false if no users exist, true otherwise
 */
export async function isApplicationSetup(): Promise<boolean> {
	return !(await isFirstUserSetup());
}

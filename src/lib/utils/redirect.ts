/**
 * Utility function to check if an error is a SvelteKit redirect
 * SvelteKit redirects are thrown as specific objects with status and location properties
 */
export function isSvelteKitRedirect(error: unknown): boolean {
	// Check for SvelteKit redirect structure
	if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
		const status = (error as any).status;
		return typeof status === 'number' && status >= 300 && status < 400;
	}

	// Also check for Response objects that are redirects
	if (error instanceof Response) {
		return error.status >= 300 && error.status < 400;
	}

	return false;
}

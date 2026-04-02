import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiError, apiOk, handleApiError } from '$lib/server/http';

export const GET: RequestHandler = async () => {
	try {
		const semester = await prisma.semester.findFirst({
			where: { isActive: true }
		});

		if (!semester) {
			return apiError(404, 'No active semester found');
		}

		return apiOk(semester);
	} catch (error) {
		return handleApiError(error, 'Error fetching active semester:', {}, 'Failed to fetch active semester');
	}
};

import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { ACTIVE_SEMESTER_KEY, semesterSelect } from '$lib/server/semester';
import { apiError, apiOk, handleApiError } from '$lib/server/http';

export const GET: RequestHandler = async () => {
	try {
		const semester = await prisma.semester.findUnique({
			where: { activeKey: ACTIVE_SEMESTER_KEY },
			select: semesterSelect
		});

		if (!semester) {
			return apiError(404, 'No active semester found');
		}

		return apiOk(semester);
	} catch (error) {
		return handleApiError(error, 'Error fetching active semester:', {}, 'Failed to fetch active semester');
	}
};

import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { ACTIVE_SEMESTER_KEY, semesterSelect } from '$lib/server/semester';
import { apiOk, handleApiError, httpError, parseIdParam } from '$lib/server/http';

export const PUT: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		const semester = await prisma.$transaction(async (tx) => {
			const existingSemester = await tx.semester.findUnique({
				where: { id },
				select: { id: true }
			});

			if (!existingSemester) {
				httpError(404, 'Semester not found');
			}

			await tx.semester.updateMany({
				where: { activeKey: ACTIVE_SEMESTER_KEY, id: { not: id } },
				data: { isActive: false, activeKey: null }
			});

			return tx.semester.update({
				where: { id },
				data: { isActive: true, activeKey: ACTIVE_SEMESTER_KEY },
				select: semesterSelect
			});
		});

		return apiOk(semester);
	} catch (error) {
		return handleApiError(
			error,
			'Error activating semester:',
			{ P2025: 'Semester not found' },
			'Failed to activate semester'
		);
	}
};

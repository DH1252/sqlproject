import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiOk, handleApiError, parseIdParam } from '$lib/server/http';

export const PUT: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		const semester = await prisma.$transaction(async (tx) => {
			await tx.semester.updateMany({
				where: { isActive: true },
				data: { isActive: false }
			});

			return tx.semester.update({
				where: { id },
				data: { isActive: true }
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

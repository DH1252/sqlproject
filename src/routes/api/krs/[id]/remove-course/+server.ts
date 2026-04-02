import { Prisma } from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiMessage, handleApiError, httpError, parseIdParam, parseOptionalPositiveInt, readRequestBody } from '$lib/server/http';
import { validateKrsCourseMutation } from '$lib/server/validation';

async function resolveMataKuliahId(request: Request) {
	const requestUrl = new URL(request.url);
	const mataKuliahIdFromQuery = parseOptionalPositiveInt(requestUrl.searchParams.get('mataKuliahId'), 'mataKuliahId');

	if (mataKuliahIdFromQuery) {
		return mataKuliahIdFromQuery;
	}

	return validateKrsCourseMutation(await readRequestBody(request)).mataKuliahId;
}

// DELETE /api/krs/[id]/remove-course - Remove course from KRS
export const DELETE: RequestHandler = async ({ params, request }) => {
	try {
		const id = parseIdParam(params.id, 'KRS ID');
		const mataKuliahId = await resolveMataKuliahId(request);

		await prisma.$transaction(
			async (tx) => {
				const krs = await tx.kRS.findUnique({
					where: { id },
					select: { status: true }
				});

				if (!krs) {
					httpError(404, 'KRS not found');
				}

				if (krs.status !== 'DRAFT') {
					httpError(400, 'Can only remove courses from DRAFT KRS');
				}

				const deleted = await tx.kRSDetail.deleteMany({
					where: {
						krsId: id,
						mataKuliahId
					}
				});

				if (deleted.count === 0) {
					httpError(404, 'Course not found in KRS');
				}
			},
			{ isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
		);

		return apiMessage('Course removed from KRS successfully');
	} catch (error) {
		return handleApiError(
			error,
			'Error removing course from KRS:',
			{},
			'Failed to remove course from KRS'
		);
	}
};

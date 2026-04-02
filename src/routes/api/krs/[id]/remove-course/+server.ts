import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiError, apiMessage, handleApiError, parseIdParam, readRequestBody } from '$lib/server/http';
import { validateKrsCourseMutation } from '$lib/server/validation';

// DELETE /api/krs/[id]/remove-course - Remove course from KRS
export const DELETE: RequestHandler = async ({ params, request }) => {
	try {
		const id = parseIdParam(params.id, 'KRS ID');
		const { mataKuliahId } = validateKrsCourseMutation(await readRequestBody(request));

		// Check if KRS exists and is in DRAFT status
		const krs = await prisma.kRS.findUnique({
			where: { id }
		});

		if (!krs) {
			return apiError(404, 'KRS not found');
		}

		if (krs.status !== 'DRAFT') {
			return apiError(400, 'Can only remove courses from DRAFT KRS');
		}

		// Remove course from KRS
		await prisma.kRSDetail.delete({
			where: {
				krsId_mataKuliahId: {
					krsId: id,
					mataKuliahId
				}
			}
		});

		return apiMessage('Course removed from KRS successfully');
	} catch (error) {
		return handleApiError(
			error,
			'Error removing course from KRS:',
			{ P2025: 'Course not found in KRS' },
			'Failed to remove course from KRS'
		);
	}
};

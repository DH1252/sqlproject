import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiError, apiOk, handleApiError, parseIdParam } from '$lib/server/http';

// PUT /api/krs/[id]/approve - Approve KRS
export const PUT: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id, 'KRS ID');

		// Check if KRS exists and is in SUBMITTED status
		const krs = await prisma.kRS.findUnique({
			where: { id }
		});

		if (!krs) {
			return apiError(404, 'KRS not found');
		}

		if (krs.status !== 'SUBMITTED') {
			return apiError(400, 'Can only approve SUBMITTED KRS');
		}

		// Update KRS status
		const updatedKrs = await prisma.kRS.update({
			where: { id },
			data: {
				status: 'APPROVED'
			},
			include: {
				mahasiswa: { select: { id: true, nim: true, nama: true } },
				semester: { select: { id: true, tahunAjaran: true, semester: true } },
				details: {
					include: {
						mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } }
					}
				}
			}
		});

		return apiOk(updatedKrs);
	} catch (error) {
		return handleApiError(error, 'Error approving KRS:', {}, 'Failed to approve KRS');
	}
};

import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiError, apiOk, handleApiError, parseIdParam } from '$lib/server/http';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const enrollmentId = parseIdParam(params.enrollmentId, 'enrollmentId');

		const nilai = await prisma.nilai.findUnique({
			where: { enrollmentId },
			include: {
				enrollment: {
					include: {
						mahasiswa: { select: { id: true, nim: true, nama: true } },
						mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } },
						semester: { select: { id: true, tahunAjaran: true, semester: true } }
					}
				}
			}
		});

		if (!nilai) {
			return apiError(404, 'Nilai not found for this enrollment');
		}

		return apiOk(nilai);
	} catch (error) {
		return handleApiError(error, 'Error fetching nilai by enrollment:', {}, 'Failed to fetch nilai');
	}
};

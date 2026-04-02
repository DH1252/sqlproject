import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiError, apiOk, handleApiError, parseIdParam, readRequestBody } from '$lib/server/http';
import { validateKrsCourseMutation } from '$lib/server/validation';

// POST /api/krs/[id]/add-course - Add course to KRS
export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const id = parseIdParam(params.id, 'KRS ID');
		const { mataKuliahId } = validateKrsCourseMutation(await readRequestBody(request));

		// Check if KRS exists and is in DRAFT status
		const krs = await prisma.kRS.findUnique({
			where: { id },
			include: {
				details: {
					include: {
						mataKuliah: { select: { sks: true } }
					}
				}
			}
		});

		if (!krs) {
			return apiError(404, 'KRS not found');
		}

		if (krs.status !== 'DRAFT') {
			return apiError(400, 'Can only add courses to DRAFT KRS');
		}

		// Check if course already exists in KRS
		const existingDetail = await prisma.kRSDetail.findUnique({
			where: {
				krsId_mataKuliahId: {
					krsId: id,
					mataKuliahId
				}
			}
		});

		if (existingDetail) {
			return apiError(400, 'Course already exists in KRS');
		}

		// Get mata kuliah to check SKS
		const mataKuliah = await prisma.mataKuliah.findUnique({
			where: { id: mataKuliahId }
		});

		if (!mataKuliah) {
			return apiError(404, 'Mata kuliah not found');
		}

		// Check max SKS limit (24 SKS)
		const currentSks = krs.details.reduce((sum: number, d: any) => sum + d.mataKuliah.sks, 0);
		if (currentSks + mataKuliah.sks > 24) {
			return apiError(400, `Maximum SKS limit (24) exceeded. Current: ${currentSks}, Adding: ${mataKuliah.sks}`);
		}

		// Add course to KRS
		const detail = await prisma.kRSDetail.create({
			data: {
				krsId: id,
				mataKuliahId
			},
			include: {
				mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } }
			}
		});

		return apiOk(detail, 201);
	} catch (error) {
		return handleApiError(
			error,
			'Error adding course to KRS:',
			{
				P2002: 'Course already exists in KRS',
				P2003: 'Course or KRS relation is invalid'
			},
			'Failed to add course to KRS'
		);
	}
};

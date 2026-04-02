import { Prisma } from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiOk, handleApiError, httpError, parseIdParam, readRequestBody } from '$lib/server/http';
import { validateKrsCourseMutation } from '$lib/server/validation';

// POST /api/krs/[id]/add-course - Add course to KRS
export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const id = parseIdParam(params.id, 'KRS ID');
		const { mataKuliahId } = validateKrsCourseMutation(await readRequestBody(request));

		const detail = await prisma.$transaction(
			async (tx) => {
				const [krs, mataKuliah] = await Promise.all([
					tx.kRS.findUnique({
						where: { id },
						include: {
							mahasiswa: { select: { programStudiId: true } },
							details: {
								include: {
									mataKuliah: { select: { sks: true } }
								}
							}
						}
					}),
					tx.mataKuliah.findUnique({
						where: { id: mataKuliahId },
						select: { id: true, kode: true, nama: true, sks: true, programStudiId: true }
					})
				]);

				if (!krs) {
					httpError(404, 'KRS not found');
				}

				if (krs.status !== 'DRAFT') {
					httpError(400, 'Can only add courses to DRAFT KRS');
				}

				if (!mataKuliah) {
					httpError(404, 'Mata kuliah not found');
				}

				if (mataKuliah.programStudiId !== krs.mahasiswa.programStudiId) {
					httpError(400, 'Course does not belong to the student study program');
				}

				const existingDetail = await tx.kRSDetail.findUnique({
					where: {
						krsId_mataKuliahId: {
							krsId: id,
							mataKuliahId
						}
					}
				});

				if (existingDetail) {
					httpError(400, 'Course already exists in KRS');
				}

				const currentSks = krs.details.reduce((sum: number, item: any) => sum + item.mataKuliah.sks, 0);
				if (currentSks + mataKuliah.sks > 24) {
					httpError(400, `Maximum SKS limit (24) exceeded. Current: ${currentSks}, Adding: ${mataKuliah.sks}`);
				}

				return tx.kRSDetail.create({
					data: {
						krsId: id,
						mataKuliahId
					},
					include: {
						mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } }
					}
				});
			},
			{ isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
		);

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

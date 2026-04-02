import { Prisma } from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { syncMahasiswaIpk } from '$lib/server/gpa';
import { apiError, apiMessage, apiOk, handleApiError, httpError, parseIdParam, readRequestBody } from '$lib/server/http';
import { validateNilaiUpdate } from '$lib/server/validation';
import { calculateGrade } from '$lib/utils/grade-calculator';

// GET /api/nilai/[id] - Get grade by ID
export const GET: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		const nilai = await prisma.nilai.findUnique({
			where: { id },
			include: {
				enrollment: {
					include: {
						mahasiswa: { select: { id: true, nim: true, nama: true } },
						mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } },
						dosen: { select: { id: true, nip: true, nama: true } },
						semester: { select: { id: true, tahunAjaran: true, semester: true } }
					}
				}
			}
		});

		if (!nilai) {
			return apiError(404, 'Nilai not found');
		}

		return apiOk(nilai);
	} catch (error) {
		return handleApiError(error, 'Error fetching nilai:', {}, 'Failed to fetch nilai');
	}
};

// PUT /api/nilai/[id] - Update grade
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const id = parseIdParam(params.id);
		const data = validateNilaiUpdate(await readRequestBody(request));

		const nilai = await prisma.$transaction(
			async (tx) => {
				const currentNilai = await tx.nilai.findUnique({
					where: { id },
					include: {
						enrollment: { select: { status: true, mahasiswaId: true } }
					}
				});

				if (!currentNilai) {
					httpError(404, 'Nilai not found');
				}

				if (currentNilai.enrollment.status === 'DROPPED') {
					httpError(409, 'Cannot update grades for a dropped enrollment');
				}

				const gradeResult = calculateGrade({
					nilaiTugas: data.nilaiTugas ?? currentNilai.nilaiTugas,
					nilaiUTS: data.nilaiUTS ?? currentNilai.nilaiUTS,
					nilaiUAS: data.nilaiUAS ?? currentNilai.nilaiUAS
				});

				const nilai = await tx.nilai.update({
					where: { id },
					data: {
						...data,
						nilaiTotal: gradeResult?.nilaiTotal ?? null,
						hurufMutu: gradeResult?.hurufMutu ?? null
					},
					include: {
						enrollment: {
							include: {
								mahasiswa: { select: { id: true, nim: true, nama: true } },
								mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } }
							}
						}
					}
				});

				await syncMahasiswaIpk(tx, currentNilai.enrollment.mahasiswaId);

				return nilai;
			},
			{ isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
		);

		return apiOk(nilai);
	} catch (error) {
		return handleApiError(
			error,
			'Error updating nilai:',
			{ P2025: 'Nilai not found' },
			'Failed to update nilai'
		);
	}
};

// DELETE /api/nilai/[id] - Delete grade
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		await prisma.$transaction(async (tx) => {
			const currentNilai = await tx.nilai.findUnique({
				where: { id },
				select: {
					enrollment: { select: { mahasiswaId: true } }
				}
			});

			if (!currentNilai) {
				httpError(404, 'Nilai not found');
			}

			await tx.nilai.delete({
				where: { id }
			});

			await syncMahasiswaIpk(tx, currentNilai.enrollment.mahasiswaId);
		});

		return apiMessage('Nilai deleted successfully');
	} catch (error) {
		return handleApiError(
			error,
			'Error deleting nilai:',
			{ P2025: 'Nilai not found' },
			'Failed to delete nilai'
		);
	}
};

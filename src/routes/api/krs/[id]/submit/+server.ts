import { Prisma } from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiOk, handleApiError, httpError, parseIdParam } from '$lib/server/http';

const submitInclude = {
	mahasiswa: { select: { id: true, nim: true, nama: true } },
	semester: { select: { id: true, tahunAjaran: true, semester: true } },
	details: {
		include: {
			mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } }
		}
	}
} as const;

// PUT /api/krs/[id]/submit - Submit KRS
export const PUT: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id, 'KRS ID');

		const updatedKrs = await prisma.$transaction(
			async (tx) => {
				const krs = await tx.kRS.findUnique({
					where: { id },
					include: { details: { select: { id: true } } }
				});

				if (!krs) {
					httpError(404, 'KRS not found');
				}

				if (krs.status !== 'DRAFT') {
					httpError(400, 'Can only submit DRAFT KRS');
				}

				if (krs.details.length === 0) {
					httpError(400, 'Cannot submit empty KRS');
				}

				await tx.kRS.update({
					where: { id },
					data: {
						status: 'SUBMITTED',
						tanggalSubmit: new Date()
					}
				});

				return tx.kRS.findUniqueOrThrow({
					where: { id },
					include: submitInclude
				});
			},
			{ isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
		);

		return apiOk(updatedKrs);
	} catch (error) {
		return handleApiError(error, 'Error submitting KRS:', {}, 'Failed to submit KRS');
	}
};

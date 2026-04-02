import { Prisma } from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiOk, handleApiError, httpError, parseIdParam } from '$lib/server/http';

const approvalInclude = {
	mahasiswa: { select: { id: true, nim: true, nama: true } },
	semester: { select: { id: true, tahunAjaran: true, semester: true } },
	details: {
		include: {
			mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } }
		}
	}
} as const;

// PUT /api/krs/[id]/approve - Approve KRS
export const PUT: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id, 'KRS ID');

		const updatedKrs = await prisma.$transaction(
			async (tx) => {
				const krs = await tx.kRS.findUnique({
					where: { id },
					select: { status: true }
				});

				if (!krs) {
					httpError(404, 'KRS not found');
				}

				if (krs.status !== 'SUBMITTED') {
					httpError(400, 'Can only approve SUBMITTED KRS');
				}

				await tx.kRS.update({
					where: { id },
					data: { status: 'APPROVED' }
				});

				return tx.kRS.findUniqueOrThrow({
					where: { id },
					include: approvalInclude
				});
			},
			{ isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
		);

		return apiOk(updatedKrs);
	} catch (error) {
		return handleApiError(error, 'Error approving KRS:', {}, 'Failed to approve KRS');
	}
};

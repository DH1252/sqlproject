import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiError, apiMessage, apiOk, handleApiError, parseIdParam, readRequestBody } from '$lib/server/http';
import { validateKRSUpdate } from '$lib/server/validation';

const krsDetailInclude = {
	mahasiswa: {
		select: {
			id: true,
			nim: true,
			nama: true,
			ipk: true,
			programStudi: {
				select: { id: true, kode: true, nama: true }
			}
		}
	},
	semester: { select: { id: true, tahunAjaran: true, semester: true, isActive: true } },
	details: {
		include: {
			mataKuliah: { select: { id: true, kode: true, nama: true, sks: true, semester: true } }
		}
	}
} as const;

// GET /api/krs/[id] - Get KRS by ID
export const GET: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		const krs = await prisma.kRS.findUnique({
			where: { id },
			include: krsDetailInclude
		});

		if (!krs) {
			return apiError(404, 'KRS not found');
		}

		const totalSks = krs.details.reduce((sum: number, detail: any) => sum + detail.mataKuliah.sks, 0);

		return apiOk({
			...krs,
			totalSks
		});
	} catch (error) {
		return handleApiError(error, 'Error fetching KRS:', {}, 'Failed to fetch KRS');
	}
};

// PUT /api/krs/[id] - Reset rejected KRS back to DRAFT
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const id = parseIdParam(params.id);
		const data = validateKRSUpdate(await readRequestBody(request));

		if (data.tanggalSubmit !== undefined) {
			return apiError(400, 'tanggalSubmit is managed automatically by workflow endpoints');
		}

		if (data.status !== 'DRAFT') {
			return apiError(400, 'Only resetting a KRS back to DRAFT is allowed via this endpoint');
		}

		const currentKrs = await prisma.kRS.findUnique({
			where: { id },
			select: { status: true }
		});

		if (!currentKrs) {
			return apiError(404, 'KRS not found');
		}

		if (currentKrs.status !== 'REJECTED' && currentKrs.status !== 'DRAFT') {
			return apiError(400, 'Only REJECTED KRS can be reset to DRAFT');
		}

		const krs = await prisma.kRS.update({
			where: { id },
			data: {
				status: 'DRAFT',
				tanggalSubmit: null
			},
			include: krsDetailInclude
		});

		return apiOk(krs);
	} catch (error) {
		return handleApiError(
			error,
			'Error updating KRS:',
			{ P2025: 'KRS not found' },
			'Failed to update KRS'
		);
	}
};

// DELETE /api/krs/[id] - Delete KRS
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		await prisma.kRS.delete({
			where: { id }
		});

		return apiMessage('KRS deleted successfully');
	} catch (error) {
		return handleApiError(
			error,
			'Error deleting KRS:',
			{ P2025: 'KRS not found' },
			'Failed to delete KRS'
		);
	}
};

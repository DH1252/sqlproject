import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiError, apiMessage, apiOk, handleApiError, parseIdParam, readRequestBody } from '$lib/server/http';
import { validateKRSUpdate } from '$lib/server/validation';

// GET /api/krs/[id] - Get KRS by ID
export const GET: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		const krs = await prisma.kRS.findUnique({
			where: { id },
			include: {
				mahasiswa: {
					select: { id: true, nim: true, nama: true, ipk: true },
					include: { programStudi: { select: { id: true, kode: true, nama: true } } }
				},
				semester: { select: { id: true, tahunAjaran: true, semester: true, isActive: true } },
				details: {
					include: {
						mataKuliah: { select: { id: true, kode: true, nama: true, sks: true, semester: true } }
					}
				}
			}
		});

		if (!krs) {
			return apiError(404, 'KRS not found');
		}

		// Calculate total SKS
		const totalSks = krs.details.reduce((sum: number, d: any) => sum + d.mataKuliah.sks, 0);

		return apiOk({
			...krs,
			totalSks
		});
	} catch (error) {
		return handleApiError(error, 'Error fetching KRS:', {}, 'Failed to fetch KRS');
	}
};

// PUT /api/krs/[id] - Update KRS status
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const id = parseIdParam(params.id);
		const data = validateKRSUpdate(await readRequestBody(request));

		const krs = await prisma.kRS.update({
			where: { id },
			data,
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

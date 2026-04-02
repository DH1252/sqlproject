import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiError, apiMessage, apiOk, handleApiError, parseIdParam, readRequestBody } from '$lib/server/http';
import { validateMataKuliahUpdate } from '$lib/server/validation';

// GET /api/mata-kuliah/[id] - Get course by ID
export const GET: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		const mataKuliah = await prisma.mataKuliah.findUnique({
			where: { id },
			include: {
				programStudi: {
					select: { id: true, kode: true, nama: true, jenjang: true }
				},
				_count: {
					select: { enrollments: true }
				}
			}
		});

		if (!mataKuliah) {
			return apiError(404, 'Mata kuliah not found');
		}

		return apiOk(mataKuliah);
	} catch (error) {
		return handleApiError(error, 'Error fetching mata kuliah:', {}, 'Failed to fetch mata kuliah');
	}
};

// PUT /api/mata-kuliah/[id] - Update course
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const id = parseIdParam(params.id);
		const data = validateMataKuliahUpdate(await readRequestBody(request));

		const mataKuliah = await prisma.mataKuliah.update({
			where: { id },
			data,
			include: {
				programStudi: {
					select: { id: true, kode: true, nama: true, jenjang: true }
				}
			}
		});

		return apiOk(mataKuliah);
	} catch (error) {
		return handleApiError(
			error,
			'Error updating mata kuliah:',
			{
				P2002: 'Kode mata kuliah already exists',
				P2025: 'Mata kuliah not found'
			},
			'Failed to update mata kuliah'
		);
	}
};

// DELETE /api/mata-kuliah/[id] - Delete course
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		await prisma.mataKuliah.delete({
			where: { id }
		});

		return apiMessage('Mata kuliah deleted successfully');
	} catch (error) {
		return handleApiError(
			error,
			'Error deleting mata kuliah:',
			{
				P2025: 'Mata kuliah not found',
				P2003: 'Cannot delete mata kuliah with related records'
			},
			'Failed to delete mata kuliah'
		);
	}
};

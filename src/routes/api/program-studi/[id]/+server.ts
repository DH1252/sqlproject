import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiError, apiMessage, apiOk, handleApiError, parseIdParam, readRequestBody } from '$lib/server/http';
import { validateProgramStudiUpdate } from '$lib/server/validation';

// GET /api/program-studi/[id] - Get study program by ID
export const GET: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		const program = await prisma.programStudi.findUnique({
			where: { id },
			include: {
				_count: {
					select: { mahasiswa: true, dosen: true, mataKuliah: true }
				}
			}
		});

		if (!program) {
			return apiError(404, 'Program studi not found');
		}

		return apiOk(program);
	} catch (error) {
		return handleApiError(error, 'Error fetching program studi:', {}, 'Failed to fetch program studi');
	}
};

// PUT /api/program-studi/[id] - Update study program
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const id = parseIdParam(params.id);
		const data = validateProgramStudiUpdate(await readRequestBody(request));

		const program = await prisma.programStudi.update({
			where: { id },
			data
		});

		return apiOk(program);
	} catch (error) {
		return handleApiError(
			error,
			'Error updating program studi:',
			{
				P2002: 'Kode program studi already exists',
				P2025: 'Program studi not found'
			},
			'Failed to update program studi'
		);
	}
};

// DELETE /api/program-studi/[id] - Delete study program
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		await prisma.programStudi.delete({
			where: { id }
		});

		return apiMessage('Program studi deleted successfully');
	} catch (error) {
		return handleApiError(
			error,
			'Error deleting program studi:',
			{
				P2025: 'Program studi not found',
				P2003: 'Cannot delete program studi with related records'
			},
			'Failed to delete program studi'
		);
	}
};

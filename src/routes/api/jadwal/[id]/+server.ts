import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiError, apiMessage, apiOk, handleApiError, parseIdParam, readRequestBody } from '$lib/server/http';
import { validateJadwalUpdate } from '$lib/server/validation';

// GET /api/jadwal/[id] - Get schedule by ID
export const GET: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		const jadwal = await prisma.jadwal.findUnique({
			where: { id },
			include: {
				_count: {
					select: { enrollments: true }
				}
			}
		});

		if (!jadwal) {
			return apiError(404, 'Jadwal not found');
		}

		return apiOk(jadwal);
	} catch (error) {
		return handleApiError(error, 'Error fetching jadwal:', {}, 'Failed to fetch jadwal');
	}
};

// PUT /api/jadwal/[id] - Update schedule
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const id = parseIdParam(params.id);
		const data = validateJadwalUpdate(await readRequestBody(request));

		if (data.jamMulai || data.jamSelesai) {
			const currentJadwal = await prisma.jadwal.findUnique({
				where: { id },
				select: { jamMulai: true, jamSelesai: true }
			});

			if (!currentJadwal) {
				return apiError(404, 'Jadwal not found');
			}

			const jamMulai = data.jamMulai ?? currentJadwal.jamMulai;
			const jamSelesai = data.jamSelesai ?? currentJadwal.jamSelesai;

			if (jamMulai >= jamSelesai) {
				return apiError(400, 'jamSelesai must be later than jamMulai');
			}
		}

		const jadwal = await prisma.jadwal.update({
			where: { id },
			data
		});

		return apiOk(jadwal);
	} catch (error) {
		return handleApiError(
			error,
			'Error updating jadwal:',
			{
				P2002: 'Schedule already exists for this day and time',
				P2025: 'Jadwal not found'
			},
			'Failed to update jadwal'
		);
	}
};

// DELETE /api/jadwal/[id] - Delete schedule
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		await prisma.jadwal.delete({
			where: { id }
		});

		return apiMessage('Jadwal deleted successfully');
	} catch (error) {
		return handleApiError(
			error,
			'Error deleting jadwal:',
			{
				P2025: 'Jadwal not found',
				P2003: 'Cannot delete jadwal with related records'
			},
			'Failed to delete jadwal'
		);
	}
};

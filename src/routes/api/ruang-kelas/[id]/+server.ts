import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiError, apiMessage, apiOk, handleApiError, parseIdParam, readRequestBody } from '$lib/server/http';
import { validateRuangKelasUpdate } from '$lib/server/validation';

// GET /api/ruang-kelas/[id] - Get classroom by ID
export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const id = parseIdParam(params.id);

		const includeJadwal = url.searchParams.get('include') === 'jadwal';

		const ruangKelas = await prisma.ruangKelas.findUnique({
			where: { id },
			include: {
				...(includeJadwal && {
					jadwalRuangan: {
						include: {
							jadwal: true,
							semester: { select: { id: true, tahunAjaran: true, semester: true } }
						}
					}
				}),
				_count: {
					select: { enrollments: true }
				}
			}
		});

		if (!ruangKelas) {
			return apiError(404, 'Ruang kelas not found');
		}

		return apiOk(ruangKelas);
	} catch (error) {
		return handleApiError(error, 'Error fetching ruang kelas:', {}, 'Failed to fetch ruang kelas');
	}
};

// PUT /api/ruang-kelas/[id] - Update classroom
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const id = parseIdParam(params.id);
		const data = validateRuangKelasUpdate(await readRequestBody(request));

		const ruangKelas = await prisma.ruangKelas.update({
			where: { id },
			data
		});

		return apiOk(ruangKelas);
	} catch (error) {
		return handleApiError(
			error,
			'Error updating ruang kelas:',
			{
				P2002: 'Kode ruang kelas already exists',
				P2025: 'Ruang kelas not found'
			},
			'Failed to update ruang kelas'
		);
	}
};

// DELETE /api/ruang-kelas/[id] - Delete classroom
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		await prisma.ruangKelas.delete({
			where: { id }
		});

		return apiMessage('Ruang kelas deleted successfully');
	} catch (error) {
		return handleApiError(
			error,
			'Error deleting ruang kelas:',
			{
				P2025: 'Ruang kelas not found',
				P2003: 'Cannot delete ruang kelas with related records'
			},
			'Failed to delete ruang kelas'
		);
	}
};

import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiError, apiMessage, apiOk, handleApiError, parseIdParam, readRequestBody } from '$lib/server/http';
import { validateDosenUpdate } from '$lib/server/validation';

// GET /api/dosen/[id] - Get lecturer by ID
export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const id = parseIdParam(params.id);

		const includeEnrollments = url.searchParams.get('include') === 'enrollments';

		const dosen = await prisma.dosen.findUnique({
			where: { id },
			include: {
				programStudi: {
					select: { id: true, kode: true, nama: true, jenjang: true }
				},
				...(includeEnrollments && {
					enrollments: {
						include: {
							mataKuliah: { select: { id: true, kode: true, nama: true, sks: true } },
							semester: { select: { id: true, tahunAjaran: true, semester: true } }
						}
					},
					_count: {
						select: { enrollments: true }
					}
				})
			}
		});

		if (!dosen) {
			return apiError(404, 'Dosen not found');
		}

		return apiOk(dosen);
	} catch (error) {
		return handleApiError(error, 'Error fetching dosen:', {}, 'Failed to fetch dosen');
	}
};

// PUT /api/dosen/[id] - Update lecturer
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const id = parseIdParam(params.id);
		const data = validateDosenUpdate(await readRequestBody(request));

		const dosen = await prisma.dosen.update({
			where: { id },
			data,
			include: {
				programStudi: {
					select: { id: true, kode: true, nama: true, jenjang: true }
				}
			}
		});

		return apiOk(dosen);
	} catch (error) {
		return handleApiError(
			error,
			'Error updating dosen:',
			{
				P2002: 'NIP or email already exists',
				P2025: 'Dosen not found'
			},
			'Failed to update dosen'
		);
	}
};

// DELETE /api/dosen/[id] - Delete lecturer
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		await prisma.dosen.delete({
			where: { id }
		});

		return apiMessage('Dosen deleted successfully');
	} catch (error) {
		return handleApiError(
			error,
			'Error deleting dosen:',
			{
				P2025: 'Dosen not found',
				P2003: 'Cannot delete dosen with related records'
			},
			'Failed to delete dosen'
		);
	}
};

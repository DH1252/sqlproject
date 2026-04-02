import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiError, apiMessage, apiOk, handleApiError, parseIdParam, readRequestBody } from '$lib/server/http';
import { validateSemesterUpdate } from '$lib/server/validation';

// GET /api/semester/[id] - Get semester by ID
export const GET: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		const semester = await prisma.semester.findUnique({
			where: { id },
			include: {
				_count: {
					select: { enrollments: true, krs: true }
				}
			}
		});

		if (!semester) {
			return apiError(404, 'Semester not found');
		}

		return apiOk(semester);
	} catch (error) {
		return handleApiError(error, 'Error fetching semester:', {}, 'Failed to fetch semester');
	}
};

// PUT /api/semester/[id] - Update semester
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const id = parseIdParam(params.id);
		const data = validateSemesterUpdate(await readRequestBody(request));

		const updatedSemester = data.isActive
			? await prisma.$transaction(async (tx) => {
					await tx.semester.updateMany({
						where: { isActive: true, id: { not: id } },
						data: { isActive: false }
					});

					return tx.semester.update({
						where: { id },
						data
					});
				})
			: await prisma.semester.update({
					where: { id },
					data
				});

		return apiOk(updatedSemester);
	} catch (error) {
		return handleApiError(
			error,
			'Error updating semester:',
			{
				P2002: 'Semester already exists for this tahun ajaran',
				P2025: 'Semester not found'
			},
			'Failed to update semester'
		);
	}
};

// DELETE /api/semester/[id] - Delete semester
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		await prisma.semester.delete({
			where: { id }
		});

		return apiMessage('Semester deleted successfully');
	} catch (error) {
		return handleApiError(
			error,
			'Error deleting semester:',
			{
				P2025: 'Semester not found',
				P2003: 'Cannot delete semester with related records'
			},
			'Failed to delete semester'
		);
	}
};

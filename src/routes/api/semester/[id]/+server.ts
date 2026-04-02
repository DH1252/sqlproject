import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { ACTIVE_SEMESTER_KEY, semesterSelect } from '$lib/server/semester';
import { apiError, apiMessage, apiOk, handleApiError, httpError, parseIdParam, readRequestBody } from '$lib/server/http';
import { validateSemesterUpdate } from '$lib/server/validation';

// GET /api/semester/[id] - Get semester by ID
export const GET: RequestHandler = async ({ params }) => {
	try {
		const id = parseIdParam(params.id);

		const semester = await prisma.semester.findUnique({
			where: { id },
			select: {
				...semesterSelect,
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

		const updatedSemester = await prisma.$transaction(async (tx) => {
			const currentSemester = await tx.semester.findUnique({
				where: { id },
				select: { id: true, isActive: true }
			});

			if (!currentSemester) {
				httpError(404, 'Semester not found');
			}

			if (data.isActive === false && currentSemester.isActive) {
				const otherActiveCount = await tx.semester.count({
					where: {
						activeKey: ACTIVE_SEMESTER_KEY,
						id: { not: id }
					}
				});

				if (otherActiveCount === 0) {
					httpError(400, 'At least one active semester must remain configured');
				}
			}

			if (data.isActive === true) {
				await tx.semester.updateMany({
					where: { activeKey: ACTIVE_SEMESTER_KEY, id: { not: id } },
					data: { isActive: false, activeKey: null }
				});
			}

			return tx.semester.update({
				where: { id },
				data: {
					...data,
					...(data.isActive !== undefined && {
						activeKey: data.isActive ? ACTIVE_SEMESTER_KEY : null
					})
				},
				select: semesterSelect
			});
		});

		return apiOk(updatedSemester);
	} catch (error) {
		return handleApiError(
			error,
			'Error updating semester:',
			{
				P2002: 'Semester already exists for this tahun ajaran or another active semester already exists',
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

		const semester = await prisma.semester.findUnique({
			where: { id },
			select: { isActive: true }
		});

		if (!semester) {
			return apiError(404, 'Semester not found');
		}

		if (semester.isActive) {
			return apiError(400, 'Active semester cannot be deleted');
		}

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

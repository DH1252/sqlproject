import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiList, apiOk, handleApiError, parseOptionalBoolean, parsePagination, readRequestBody } from '$lib/server/http';
import { validateSemesterCreate } from '$lib/server/validation';

// GET /api/semester - List all semesters
export const GET: RequestHandler = async ({ url }) => {
	try {
		const { page, limit, skip } = parsePagination(url);
		const isActive = parseOptionalBoolean(url.searchParams.get('isActive'), 'isActive');

		const where: any = {};

		if (isActive !== undefined) {
			where.isActive = isActive;
		}

		const [semester, total] = await Promise.all([
			prisma.semester.findMany({
				where,
				skip,
				take: limit,
				orderBy: [{ tahunAjaran: 'desc' }, { semester: 'desc' }]
			}),
			prisma.semester.count({ where })
		]);

		return apiList(semester, {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		});
	} catch (error) {
		return handleApiError(error, 'Error fetching semester:', {}, 'Failed to fetch semester');
	}
};

// POST /api/semester - Create new semester
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = validateSemesterCreate(await readRequestBody(request));

		const newSemester = data.isActive
			? await prisma.$transaction(async (tx) => {
					await tx.semester.updateMany({
						where: { isActive: true },
						data: { isActive: false }
					});

					return tx.semester.create({ data });
				})
			: await prisma.semester.create({ data });

		return apiOk(newSemester, 201);
	} catch (error) {
		return handleApiError(
			error,
			'Error creating semester:',
			{ P2002: 'Semester already exists for this tahun ajaran' },
			'Failed to create semester'
		);
	}
};

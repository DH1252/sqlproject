import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { ACTIVE_SEMESTER_KEY, semesterSelect } from '$lib/server/semester';
import { apiList, apiOk, handleApiError, httpError, parseOptionalBoolean, parsePagination, readRequestBody } from '$lib/server/http';
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
				select: semesterSelect,
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

		const newSemester = await prisma.$transaction(async (tx) => {
			const activeCount = await tx.semester.count({ where: { activeKey: ACTIVE_SEMESTER_KEY } });

			if (activeCount === 0 && !data.isActive) {
				httpError(400, 'The first semester must be created as active');
			}

			if (data.isActive) {
				await tx.semester.updateMany({
					where: { activeKey: ACTIVE_SEMESTER_KEY },
					data: { isActive: false, activeKey: null }
				});
			}

			return tx.semester.create({
				data: {
					...data,
					activeKey: data.isActive ? ACTIVE_SEMESTER_KEY : null
				},
				select: semesterSelect
			});
		});

		return apiOk(newSemester, 201);
	} catch (error) {
		return handleApiError(
			error,
			'Error creating semester:',
			{ P2002: 'Semester already exists for this tahun ajaran or another active semester already exists' },
			'Failed to create semester'
		);
	}
};

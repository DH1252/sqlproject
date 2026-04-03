import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { semesterSelect } from '$lib/server/semester';
import { apiList, apiOk, handleApiError, httpError, parseOptionalBoolean, parsePagination, readRequestBody } from '$lib/server/http';
import { validateSemesterCreate } from '$lib/server/validation';

// GET /api/semester - List all semesters
export const GET: RequestHandler = async ({ url }) => {
	try {
		const { page, limit, skip } = parsePagination(url);
		const isActive = parseOptionalBoolean(url.searchParams.get('isActive'), 'isActive');
		const search = url.searchParams.get('search')?.trim();

		const where: any = {};

		if (isActive !== undefined) {
			where.isActive = isActive;
		}

		if (search) {
			const semesterKeyword = search.toUpperCase();
			where.OR = [
				{ tahunAjaran: { contains: search, mode: 'insensitive' } },
				...(['GANJIL', 'GENAP'].includes(semesterKeyword) ? [{ semester: semesterKeyword }] : [])
			];
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
			const activeCount = await tx.semester.count({ where: { isActive: true } });

			if (activeCount === 0 && !data.isActive) {
				httpError(400, 'The first semester must be created as active');
			}

			if (data.isActive) {
				await tx.semester.updateMany({
					where: { isActive: true },
					data: { isActive: false }
				});
			}

			return tx.semester.create({
				data,
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

import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { apiList, apiOk, handleApiError, parsePagination, readRequestBody } from '$lib/server/http';
import { validateProgramStudiCreate } from '$lib/server/validation';

// GET /api/program-studi - List all study programs
export const GET: RequestHandler = async ({ url }) => {
	try {
		const { page, limit, skip } = parsePagination(url);
		const search = url.searchParams.get('search') || '';

		const where = search
			? {
				OR: [{ kode: { contains: search } }, { nama: { contains: search } }]
			}
			: undefined;

		const [programs, total] = await Promise.all([
			prisma.programStudi.findMany({
				where,
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' }
			}),
			prisma.programStudi.count({ where })
		]);

		return apiList(programs, {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		});
	} catch (error) {
		return handleApiError(error, 'Error fetching program studi:', {}, 'Failed to fetch program studi');
	}
};

// POST /api/program-studi - Create new study program
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = validateProgramStudiCreate(await readRequestBody(request));

		const program = await prisma.programStudi.create({
			data
		});

		return apiOk(program, 201);
	} catch (error) {
		return handleApiError(
			error,
			'Error creating program studi:',
			{ P2002: 'Kode program studi already exists' },
			'Failed to create program studi'
		);
	}
};

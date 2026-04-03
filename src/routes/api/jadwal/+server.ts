import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { Hari } from '$lib/types';
import {
	apiList,
	apiOk,
	handleApiError,
	parseOptionalEnum,
	parsePagination,
	readRequestBody
} from '$lib/server/http';
import { validateJadwalCreate } from '$lib/server/validation';

// GET /api/jadwal - List all schedules
export const GET: RequestHandler = async ({ url }) => {
	try {
		const { page, limit, skip } = parsePagination(url, { defaultLimit: 50 });
		const hari = parseOptionalEnum(url.searchParams.get('hari'), 'hari', Object.values(Hari));
		const search = url.searchParams.get('search')?.trim();

		const where: any = {};

		if (hari) {
			where.hari = hari;
		}

		if (search) {
			const hariKeyword = search.toUpperCase();
			where.OR = [
				{ jamMulai: { contains: search } },
				{ jamSelesai: { contains: search } },
				...((Object.values(Hari) as string[]).includes(hariKeyword) ? [{ hari: hariKeyword }] : [])
			];
		}

		const [jadwal, total] = await Promise.all([
			prisma.jadwal.findMany({
				where,
				skip,
				take: limit,
				orderBy: [{ hari: 'asc' }, { jamMulai: 'asc' }]
			}),
			prisma.jadwal.count({ where })
		]);

		return apiList(jadwal, {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		});
	} catch (error) {
		return handleApiError(error, 'Error fetching jadwal:', {}, 'Failed to fetch jadwal');
	}
};

// POST /api/jadwal - Create new schedule
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = validateJadwalCreate(await readRequestBody(request));

		const jadwal = await prisma.jadwal.create({
			data
		});

		return apiOk(jadwal, 201);
	} catch (error) {
		return handleApiError(
			error,
			'Error creating jadwal:',
			{ P2002: 'Schedule already exists for this day and time' },
			'Failed to create jadwal'
		);
	}
};

import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { StatusRuangKelas, TipeRuangKelas } from '$lib/types';
import {
	apiList,
	apiOk,
	handleApiError,
	parseOptionalEnum,
	parsePagination,
	readRequestBody
} from '$lib/server/http';
import { validateRuangKelasCreate } from '$lib/server/validation';

// GET /api/ruang-kelas - List all classrooms
export const GET: RequestHandler = async ({ url }) => {
	try {
		const { page, limit, skip } = parsePagination(url);
		const search = url.searchParams.get('search') || '';
		const tipe = parseOptionalEnum(url.searchParams.get('tipe'), 'tipe', Object.values(TipeRuangKelas));
		const status = parseOptionalEnum(url.searchParams.get('status'), 'status', Object.values(StatusRuangKelas));
		const gedung = url.searchParams.get('gedung');

		const where: any = {};

		if (search) {
			where.OR = [
				{ kode: { contains: search } },
				{ nama: { contains: search } }
			];
		}

		if (tipe) {
			where.tipe = tipe;
		}

		if (status) {
			where.status = status;
		}

		if (gedung) {
			where.gedung = gedung;
		}

		const [ruangKelas, total] = await Promise.all([
			prisma.ruangKelas.findMany({
				where,
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' }
			}),
			prisma.ruangKelas.count({ where })
		]);

		return apiList(ruangKelas, {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		});
	} catch (error) {
		return handleApiError(error, 'Error fetching ruang kelas:', {}, 'Failed to fetch ruang kelas');
	}
};

// POST /api/ruang-kelas - Create new classroom
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = validateRuangKelasCreate(await readRequestBody(request));

		const ruangKelas = await prisma.ruangKelas.create({
			data
		});

		return apiOk(ruangKelas, 201);
	} catch (error) {
		return handleApiError(
			error,
			'Error creating ruang kelas:',
			{ P2002: 'Kode ruang kelas already exists' },
			'Failed to create ruang kelas'
		);
	}
};

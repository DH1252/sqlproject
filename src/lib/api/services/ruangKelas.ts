import { apiDelete, apiGet, apiGetList, apiPost, apiPut, buildQueryString } from '../client';
import type {
	ApiListResponse,
	ApiMessageResponse,
	ApiResponse,
	JadwalRuangan,
	RuangKelas,
	RuangKelasFilter,
	RuangKelasFormData
} from '$lib/types';

const ENDPOINT = '/api/ruang-kelas';

export const ruangKelasService = {
	async getAll(params: RuangKelasFilter = {}): Promise<ApiListResponse<RuangKelas>> {
		const query = buildQueryString({
			page: params.page,
			limit: params.limit,
			tipe: params.tipe,
			status: params.status,
			gedung: params.gedung
		});
		return apiGetList<RuangKelas>(`${ENDPOINT}${query}`);
	},

	async getById(id: number): Promise<ApiResponse<RuangKelas>> {
		return apiGet<RuangKelas>(`${ENDPOINT}/${id}`);
	},

	async create(data: RuangKelasFormData): Promise<ApiResponse<RuangKelas>> {
		return apiPost<RuangKelas>(ENDPOINT, data);
	},

	async update(id: number, data: RuangKelasFormData): Promise<ApiResponse<RuangKelas>> {
		return apiPut<RuangKelas>(`${ENDPOINT}/${id}`, data);
	},

	async delete(id: number): Promise<ApiResponse<null> | ApiMessageResponse> {
		return apiDelete<null>(`${ENDPOINT}/${id}`);
	},

	async getJadwal(id: number): Promise<ApiResponse<JadwalRuangan[]>> {
		return apiGet<JadwalRuangan[]>(`${ENDPOINT}/${id}/jadwal`);
	},

	async checkAvailability(
		id: number,
		jadwalId: number,
		semesterId: number
	): Promise<ApiResponse<{ available: boolean; conflicts?: string[] }>> {
		const query = buildQueryString({ jadwalId, semesterId });
		return apiGet<{ available: boolean; conflicts?: string[] }>(`${ENDPOINT}/${id}/available${query}`);
	}
};

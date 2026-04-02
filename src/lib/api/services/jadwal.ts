import { apiDelete, apiGet, apiGetList, apiPost, apiPut, buildQueryString } from '../client';
import type {
	ApiListResponse,
	ApiMessageResponse,
	ApiResponse,
	Jadwal,
	JadwalFormData,
	ListQueryParams
} from '$lib/types';

const ENDPOINT = '/api/jadwal';

export const jadwalService = {
	async getAll(params: ListQueryParams = {}): Promise<ApiListResponse<Jadwal>> {
		const query = buildQueryString({
			page: params.page,
			limit: params.limit
		});
		return apiGetList<Jadwal>(`${ENDPOINT}${query}`);
	},

	async getById(id: number): Promise<ApiResponse<Jadwal>> {
		return apiGet<Jadwal>(`${ENDPOINT}/${id}`);
	},

	async create(data: JadwalFormData): Promise<ApiResponse<Jadwal>> {
		return apiPost<Jadwal>(ENDPOINT, data);
	},

	async update(id: number, data: JadwalFormData): Promise<ApiResponse<Jadwal>> {
		return apiPut<Jadwal>(`${ENDPOINT}/${id}`, data);
	},

	async delete(id: number): Promise<ApiResponse<null> | ApiMessageResponse> {
		return apiDelete<null>(`${ENDPOINT}/${id}`);
	}
};

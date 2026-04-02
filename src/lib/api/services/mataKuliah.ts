import { apiDelete, apiGet, apiGetList, apiPost, apiPut, buildQueryString } from '../client';
import type {
	ApiListResponse,
	ApiMessageResponse,
	ApiResponse,
	MataKuliah,
	MataKuliahFilter,
	MataKuliahFormData
} from '$lib/types';

const ENDPOINT = '/api/mata-kuliah';

export const mataKuliahService = {
	async getAll(params: MataKuliahFilter = {}): Promise<ApiListResponse<MataKuliah>> {
		const query = buildQueryString({
			page: params.page,
			limit: params.limit,
			programStudiId: params.programStudiId,
			semester: params.semester
		});
		return apiGetList<MataKuliah>(`${ENDPOINT}${query}`);
	},

	async getById(id: number): Promise<ApiResponse<MataKuliah>> {
		return apiGet<MataKuliah>(`${ENDPOINT}/${id}`);
	},

	async create(data: MataKuliahFormData): Promise<ApiResponse<MataKuliah>> {
		return apiPost<MataKuliah>(ENDPOINT, data);
	},

	async update(id: number, data: MataKuliahFormData): Promise<ApiResponse<MataKuliah>> {
		return apiPut<MataKuliah>(`${ENDPOINT}/${id}`, data);
	},

	async delete(id: number): Promise<ApiResponse<null> | ApiMessageResponse> {
		return apiDelete<null>(`${ENDPOINT}/${id}`);
	}
};

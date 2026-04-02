import { apiDelete, apiGet, apiGetList, apiPost, apiPut, buildQueryString } from '../client';
import type {
	ApiListResponse,
	ApiMessageResponse,
	ApiResponse,
	Dosen,
	DosenFilter,
	DosenFormData,
	Enrollment
} from '$lib/types';

const ENDPOINT = '/api/dosen';

export const dosenService = {
	async getAll(params: DosenFilter = {}): Promise<ApiListResponse<Dosen>> {
		const query = buildQueryString({
			page: params.page,
			limit: params.limit,
			search: params.search,
			programStudiId: params.programStudiId
		});
		return apiGetList<Dosen>(`${ENDPOINT}${query}`);
	},

	async getById(id: number): Promise<ApiResponse<Dosen>> {
		return apiGet<Dosen>(`${ENDPOINT}/${id}`);
	},

	async create(data: DosenFormData): Promise<ApiResponse<Dosen>> {
		return apiPost<Dosen>(ENDPOINT, data);
	},

	async update(id: number, data: DosenFormData): Promise<ApiResponse<Dosen>> {
		return apiPut<Dosen>(`${ENDPOINT}/${id}`, data);
	},

	async delete(id: number): Promise<ApiResponse<null> | ApiMessageResponse> {
		return apiDelete<null>(`${ENDPOINT}/${id}`);
	},

	async getEnrollments(id: number): Promise<ApiResponse<Enrollment[]>> {
		return apiGet<Enrollment[]>(`${ENDPOINT}/${id}/enrollments`);
	}
};

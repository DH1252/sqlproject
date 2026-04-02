import { apiDelete, apiGet, apiGetList, apiPost, apiPut, buildQueryString } from '../client';
import type {
	ApiListResponse,
	ApiMessageResponse,
	ApiResponse,
	KRS,
	KRSDetail,
	KRSFilter,
	KRSFormData
} from '$lib/types';

const ENDPOINT = '/api/krs';

export const krsService = {
	async getAll(params: KRSFilter = {}): Promise<ApiListResponse<KRS>> {
		const query = buildQueryString({
			page: params.page,
			limit: params.limit,
			mahasiswaId: params.mahasiswaId,
			semesterId: params.semesterId,
			status: params.status,
			includeDetails: params.includeDetails ?? false
		});
		return apiGetList<KRS>(`${ENDPOINT}${query}`);
	},

	async getById(id: number): Promise<ApiResponse<KRS>> {
		return apiGet<KRS>(`${ENDPOINT}/${id}`);
	},

	async create(data: KRSFormData): Promise<ApiResponse<KRS>> {
		return apiPost<KRS>(ENDPOINT, data);
	},

	async update(id: number, data: Partial<KRSFormData>): Promise<ApiResponse<KRS>> {
		return apiPut<KRS>(`${ENDPOINT}/${id}`, data);
	},

	async delete(id: number): Promise<ApiResponse<null> | ApiMessageResponse> {
		return apiDelete<null>(`${ENDPOINT}/${id}`);
	},

	async addCourse(id: number, mataKuliahId: number): Promise<ApiResponse<KRSDetail>> {
		return apiPost<KRSDetail>(`${ENDPOINT}/${id}/add-course`, { mataKuliahId });
	},

	async removeCourse(id: number, mataKuliahId: number): Promise<ApiResponse<null> | ApiMessageResponse> {
		return apiDelete<null>(`${ENDPOINT}/${id}/remove-course`, { mataKuliahId });
	},

	async submit(id: number): Promise<ApiResponse<KRS>> {
		return apiPut<KRS>(`${ENDPOINT}/${id}/submit`, {});
	},

	async approve(id: number): Promise<ApiResponse<KRS>> {
		return apiPut<KRS>(`${ENDPOINT}/${id}/approve`, {});
	},

	async reject(id: number): Promise<ApiResponse<KRS>> {
		return apiPut<KRS>(`${ENDPOINT}/${id}/reject`, {});
	}
};

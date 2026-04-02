import { apiDelete, apiGet, apiGetList, apiPost, apiPut, buildQueryString } from '../client';
import type {
	ApiListResponse,
	ApiMessageResponse,
	ApiResponse,
	ListQueryParams,
	Semester,
	SemesterFormData
} from '$lib/types';

const ENDPOINT = '/api/semester';

export const semesterService = {
	async getAll(params: ListQueryParams = {}): Promise<ApiListResponse<Semester>> {
		const query = buildQueryString({
			page: params.page,
			limit: params.limit
		});
		return apiGetList<Semester>(`${ENDPOINT}${query}`);
	},

	async getActive(): Promise<ApiResponse<Semester>> {
		return apiGet<Semester>(`${ENDPOINT}/active`);
	},

	async getById(id: number): Promise<ApiResponse<Semester>> {
		return apiGet<Semester>(`${ENDPOINT}/${id}`);
	},

	async create(data: SemesterFormData): Promise<ApiResponse<Semester>> {
		return apiPost<Semester>(ENDPOINT, data);
	},

	async update(id: number, data: SemesterFormData): Promise<ApiResponse<Semester>> {
		return apiPut<Semester>(`${ENDPOINT}/${id}`, data);
	},

	async activate(id: number): Promise<ApiResponse<Semester>> {
		return apiPut<Semester>(`${ENDPOINT}/${id}/activate`, {});
	},

	async delete(id: number): Promise<ApiResponse<null> | ApiMessageResponse> {
		return apiDelete<null>(`${ENDPOINT}/${id}`);
	}
};

import { apiDelete, apiGet, apiGetList, apiPost, apiPut, buildQueryString } from '../client';
import type {
	ApiListResponse,
	ApiMessageResponse,
	ApiResponse,
	ListQueryParams,
	ProgramStudi,
	ProgramStudiFormData
} from '$lib/types';

const ENDPOINT = '/api/program-studi';

export const programStudiService = {
	async getAll(params: ListQueryParams = {}): Promise<ApiListResponse<ProgramStudi>> {
		const query = buildQueryString({
			page: params.page,
			limit: params.limit
		});
		return apiGetList<ProgramStudi>(`${ENDPOINT}${query}`);
	},

	async getById(id: number): Promise<ApiResponse<ProgramStudi>> {
		return apiGet<ProgramStudi>(`${ENDPOINT}/${id}`);
	},

	async create(data: ProgramStudiFormData): Promise<ApiResponse<ProgramStudi>> {
		return apiPost<ProgramStudi>(ENDPOINT, data);
	},

	async update(id: number, data: ProgramStudiFormData): Promise<ApiResponse<ProgramStudi>> {
		return apiPut<ProgramStudi>(`${ENDPOINT}/${id}`, data);
	},

	async delete(id: number): Promise<ApiResponse<null> | ApiMessageResponse> {
		return apiDelete<null>(`${ENDPOINT}/${id}`);
	}
};

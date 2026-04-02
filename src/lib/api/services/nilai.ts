import { apiDelete, apiGet, apiGetList, apiPost, apiPut, buildQueryString } from '../client';
import type {
	ApiListResponse,
	ApiMessageResponse,
	ApiResponse,
	Nilai,
	NilaiFilter,
	NilaiFormData
} from '$lib/types';

const ENDPOINT = '/api/nilai';

export const nilaiService = {
	async getAll(params: NilaiFilter = {}): Promise<ApiListResponse<Nilai>> {
		const query = buildQueryString({
			page: params.page,
			limit: params.limit,
			semesterId: params.semesterId,
			mahasiswaId: params.mahasiswaId,
			includeSemester: params.includeSemester ?? false
		});
		return apiGetList<Nilai>(`${ENDPOINT}${query}`);
	},

	async getById(id: number): Promise<ApiResponse<Nilai>> {
		return apiGet<Nilai>(`${ENDPOINT}/${id}`);
	},

	async getByEnrollment(enrollmentId: number): Promise<ApiResponse<Nilai>> {
		return apiGet<Nilai>(`${ENDPOINT}/enrollment/${enrollmentId}`);
	},

	async create(data: NilaiFormData): Promise<ApiResponse<Nilai>> {
		return apiPost<Nilai>(ENDPOINT, data);
	},

	async update(id: number, data: Partial<NilaiFormData>): Promise<ApiResponse<Nilai>> {
		return apiPut<Nilai>(`${ENDPOINT}/${id}`, data);
	},

	async delete(id: number): Promise<ApiResponse<null> | ApiMessageResponse> {
		return apiDelete<null>(`${ENDPOINT}/${id}`);
	}
};

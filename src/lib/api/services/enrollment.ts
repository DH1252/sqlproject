import { apiDelete, apiGet, apiGetList, apiPost, apiPut, buildQueryString } from '../client';
import type {
	ApiListResponse,
	ApiMessageResponse,
	ApiResponse,
	Enrollment,
	EnrollmentFilter,
	EnrollmentFormData
} from '$lib/types';

const ENDPOINT = '/api/enrollment';

export const enrollmentService = {
	async getAll(params: EnrollmentFilter = {}): Promise<ApiListResponse<Enrollment>> {
		const query = buildQueryString({
			page: params.page,
			limit: params.limit,
			mahasiswaId: params.mahasiswaId,
			mataKuliahId: params.mataKuliahId,
			dosenId: params.dosenId,
			semesterId: params.semesterId,
			status: params.status,
			includeSemester: params.includeSemester ?? false,
			includeNilai: params.includeNilai ?? false
		});
		return apiGetList<Enrollment>(`${ENDPOINT}${query}`);
	},

	async getById(id: number): Promise<ApiResponse<Enrollment>> {
		return apiGet<Enrollment>(`${ENDPOINT}/${id}`);
	},

	async create(data: EnrollmentFormData): Promise<ApiResponse<Enrollment>> {
		return apiPost<Enrollment>(ENDPOINT, data);
	},

	async update(id: number, data: Partial<EnrollmentFormData>): Promise<ApiResponse<Enrollment>> {
		return apiPut<Enrollment>(`${ENDPOINT}/${id}`, data);
	},

	async delete(id: number): Promise<ApiResponse<null> | ApiMessageResponse> {
		return apiDelete<null>(`${ENDPOINT}/${id}`);
	},

	async checkConflict(
		mahasiswaId: number,
		jadwalId: number,
		semesterId: number,
		excludeId?: number
	): Promise<ApiResponse<{ hasConflict: boolean; conflicts?: Enrollment[] }>> {
		const query = buildQueryString({ mahasiswaId, jadwalId, semesterId, excludeId });
		return apiGet<{ hasConflict: boolean; conflicts?: Enrollment[] }>(`${ENDPOINT}/check-conflict${query}`);
	}
};

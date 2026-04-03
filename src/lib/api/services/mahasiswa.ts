import { apiDelete, apiGet, apiGetList, apiPost, apiPut, buildQueryString } from '../client';
import type {
	ApiListResponse,
	ApiMessageResponse,
	ApiResponse,
	Enrollment,
	KRS,
	MahasiswaAcademicRecord,
	Mahasiswa,
	MahasiswaFilter,
	MahasiswaFormData,
	Nilai
} from '$lib/types';

const ENDPOINT = '/api/mahasiswa';

export const mahasiswaService = {
	async getAll(params: MahasiswaFilter = {}): Promise<ApiListResponse<Mahasiswa>> {
		const query = buildQueryString({
			page: params.page,
			limit: params.limit,
			search: params.search,
			programStudiId: params.programStudiId,
			angkatan: params.angkatan,
			status: params.status
		});
		return apiGetList<Mahasiswa>(`${ENDPOINT}${query}`);
	},

	async getById(id: number): Promise<ApiResponse<Mahasiswa>> {
		return apiGet<Mahasiswa>(`${ENDPOINT}/${id}`);
	},

	async getAcademicRecord(id: number): Promise<ApiResponse<MahasiswaAcademicRecord>> {
		return apiGet<MahasiswaAcademicRecord>(`${ENDPOINT}/${id}?include=nilai`);
	},

	async create(data: MahasiswaFormData): Promise<ApiResponse<Mahasiswa>> {
		return apiPost<Mahasiswa>(ENDPOINT, data);
	},

	async update(id: number, data: MahasiswaFormData): Promise<ApiResponse<Mahasiswa>> {
		return apiPut<Mahasiswa>(`${ENDPOINT}/${id}`, data);
	},

	async delete(id: number): Promise<ApiResponse<null> | ApiMessageResponse> {
		return apiDelete<null>(`${ENDPOINT}/${id}`);
	},

	async getEnrollments(id: number): Promise<ApiResponse<Enrollment[]>> {
		return apiGet<Enrollment[]>(`${ENDPOINT}/${id}/enrollments`);
	},

	async getNilai(id: number): Promise<ApiResponse<Nilai[]>> {
		return apiGet<Nilai[]>(`${ENDPOINT}/${id}/nilai`);
	},

	async getKRS(id: number): Promise<ApiResponse<KRS[]>> {
		return apiGet<KRS[]>(`${ENDPOINT}/${id}/krs`);
	}
};

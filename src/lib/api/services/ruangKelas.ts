import { apiDelete, apiGet, apiGetList, apiPost, apiPut, buildQueryString } from '../client';
import type {
	ApiListResponse,
	ApiMessageResponse,
	ApiResponse,
	JadwalRuangan,
	RuangKelasAvailabilityResponse,
	RuangKelas,
	RuangKelasFilter,
	RuangKelasFormData,
	RuangKelasTimetableResponse,
	RuangKelasUtilizationResponse,
	TipeRuangKelas
} from '$lib/types';

const ENDPOINT = '/api/ruang-kelas';

export const ruangKelasService = {
	async getAll(params: RuangKelasFilter = {}): Promise<ApiListResponse<RuangKelas>> {
		const query = buildQueryString({
			page: params.page,
			limit: params.limit,
			search: params.search,
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

	async getJadwal(id: number, semesterId?: number): Promise<ApiResponse<JadwalRuangan[]>> {
		const query = buildQueryString({ semesterId });
		return apiGet<JadwalRuangan[]>(`${ENDPOINT}/${id}/jadwal${query}`);
	},

	async checkAvailability(
		id: number,
		jadwalId: number,
		semesterId: number,
		excludeEnrollmentId?: number
	): Promise<ApiResponse<{ available: boolean; conflicts?: string[] }>> {
		const query = buildQueryString({ jadwalId, semesterId, excludeEnrollmentId });
		return apiGet<{ available: boolean; conflicts?: string[] }>(`${ENDPOINT}/${id}/available${query}`);
	},

	async getAvailableRooms(
		jadwalId: number,
		semesterId: number,
		options: {
			excludeEnrollmentId?: number;
			kapasitasMin?: number;
			tipe?: TipeRuangKelas;
		} = {}
	): Promise<ApiResponse<RuangKelasAvailabilityResponse>> {
		const query = buildQueryString({
			jadwalId,
			semesterId,
			excludeEnrollmentId: options.excludeEnrollmentId,
			kapasitasMin: options.kapasitasMin,
			tipe: options.tipe
		});
		return apiGet<RuangKelasAvailabilityResponse>(`${ENDPOINT}/available${query}`);
	},

	async getUtilization(semesterId?: number): Promise<ApiResponse<RuangKelasUtilizationResponse>> {
		const query = buildQueryString({ semesterId });
		return apiGet<RuangKelasUtilizationResponse>(`${ENDPOINT}/utilization${query}`);
	},

	async getTimetable(id: number, semesterId?: number): Promise<ApiResponse<RuangKelasTimetableResponse>> {
		const query = buildQueryString({ semesterId });
		return apiGet<RuangKelasTimetableResponse>(`${ENDPOINT}/${id}/timetable${query}`);
	}
};

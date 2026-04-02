// ============================================
// Base Types
// ============================================

export interface PaginationInfo {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface ApiSuccessResponse<T> {
	success: true;
	data: T;
	message?: string;
}

export interface ApiListSuccessResponse<T> {
	success: true;
	data: T[];
	pagination: PaginationInfo;
	message?: string;
}

export interface ApiErrorResponse {
	success: false;
	error: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type ApiListResponse<T> = ApiListSuccessResponse<T> | ApiErrorResponse;

export interface ApiMessageResponse {
	success: true;
	data: null;
	message: string;
}

// ============================================
// Enums
// ============================================

export enum StatusMahasiswa {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	GRADUATED = 'GRADUATED'
}

export enum TipeRuangKelas {
	REGULER = 'REGULER',
	LAB_KOMPUTER = 'LAB_KOMPUTER',
	LAB_BAHASA = 'LAB_BAHASA',
	AUDITORIUM = 'AUDITORIUM'
}

export enum StatusRuangKelas {
	AVAILABLE = 'AVAILABLE',
	MAINTENANCE = 'MAINTENANCE',
	UNAVAILABLE = 'UNAVAILABLE'
}

export enum JenisSemester {
	GANJIL = 'GANJIL',
	GENAP = 'GENAP'
}

export enum Hari {
	SENIN = 'SENIN',
	SELASA = 'SELASA',
	RABU = 'RABU',
	KAMIS = 'KAMIS',
	JUMAT = 'JUMAT',
	SABTU = 'SABTU',
	MINGGU = 'MINGGU'
}

export enum StatusEnrollment {
	ACTIVE = 'ACTIVE',
	COMPLETED = 'COMPLETED',
	DROPPED = 'DROPPED'
}

export enum StatusKRS {
	DRAFT = 'DRAFT',
	SUBMITTED = 'SUBMITTED',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED'
}

// ============================================
// Entity Types
// ============================================

export interface ProgramStudi {
	id: number;
	kode: string;
	nama: string;
	jenjang: string;
	createdAt: string;
	updatedAt: string;
}

export interface Mahasiswa {
	id: number;
	nim: string;
	nama: string;
	email: string;
	programStudiId: number;
	programStudi?: ProgramStudi;
	angkatan: number;
	status: StatusMahasiswa;
	ipk: number;
	createdAt: string;
	updatedAt: string;
}

export interface Dosen {
	id: number;
	nip: string;
	nama: string;
	email: string;
	programStudiId: number;
	programStudi?: ProgramStudi;
	jabatan: string;
	createdAt: string;
	updatedAt: string;
}

export interface MataKuliah {
	id: number;
	kode: string;
	nama: string;
	sks: number;
	semester: number;
	programStudiId: number;
	programStudi?: ProgramStudi;
	deskripsi?: string;
	createdAt: string;
	updatedAt: string;
}

export interface RuangKelas {
	id: number;
	kode: string;
	nama: string;
	tipe: TipeRuangKelas;
	kapasitas: number;
	hasProyektor: boolean;
	hasAC: boolean;
	gedung: string;
	lantai: number;
	status: StatusRuangKelas;
	createdAt: string;
	updatedAt: string;
}

export interface Semester {
	id: number;
	tahunAjaran: string;
	semester: JenisSemester;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Jadwal {
	id: number;
	hari: Hari;
	jamMulai: string;
	jamSelesai: string;
	createdAt: string;
	updatedAt: string;
}

export interface Enrollment {
	id: number;
	mahasiswaId: number;
	mahasiswa?: Mahasiswa;
	mataKuliahId: number;
	mataKuliah?: MataKuliah;
	dosenId: number;
	dosen?: Dosen;
	ruangKelasId: number;
	ruangKelas?: RuangKelas;
	jadwalId: number;
	jadwal?: Jadwal;
	semesterId: number;
	semester?: Semester;
	status: StatusEnrollment;
	nilai?: Nilai;
	createdAt: string;
	updatedAt: string;
}

export interface Nilai {
	id: number;
	enrollmentId: number;
	enrollment?: Enrollment;
	nilaiTugas?: number | null;
	nilaiUTS?: number | null;
	nilaiUAS?: number | null;
	nilaiTotal?: number | null;
	hurufMutu?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface KRS {
	id: number;
	mahasiswaId: number;
	mahasiswa?: Mahasiswa;
	semesterId: number;
	semester?: Semester;
	status: StatusKRS;
	tanggalSubmit?: string;
	details?: KRSDetail[];
	createdAt: string;
	updatedAt: string;
}

export interface KRSDetail {
	id: number;
	krsId: number;
	mataKuliahId: number;
	mataKuliah?: MataKuliah;
	createdAt: string;
}

export interface JadwalRuangan {
	id: number;
	ruangKelasId: number;
	ruangKelas?: RuangKelas;
	jadwalId: number;
	jadwal?: Jadwal;
	semesterId: number;
	semester?: Semester;
	keterangan?: string;
	createdAt: string;
}

// ============================================
// Form Data Types
// ============================================

export interface ProgramStudiFormData {
	kode: string;
	nama: string;
	jenjang: string;
}

export interface MahasiswaFormData {
	nim: string;
	nama: string;
	email: string;
	programStudiId: number;
	angkatan: number;
	status: StatusMahasiswa;
}

export interface DosenFormData {
	nip: string;
	nama: string;
	email: string;
	programStudiId: number;
	jabatan: string;
}

export interface MataKuliahFormData {
	kode: string;
	nama: string;
	sks: number;
	semester: number;
	programStudiId: number;
	deskripsi?: string;
}

export interface RuangKelasFormData {
	kode: string;
	nama: string;
	tipe: TipeRuangKelas;
	kapasitas: number;
	hasProyektor: boolean;
	hasAC: boolean;
	gedung: string;
	lantai: number;
	status: StatusRuangKelas;
}

export interface SemesterFormData {
	tahunAjaran: string;
	semester: JenisSemester;
	isActive: boolean;
}

export interface JadwalFormData {
	hari: Hari;
	jamMulai: string;
	jamSelesai: string;
}

export interface EnrollmentFormData {
	mahasiswaId: number;
	mataKuliahId: number;
	dosenId: number;
	ruangKelasId: number;
	jadwalId: number;
	semesterId: number;
	status: StatusEnrollment;
}

export interface NilaiFormData {
	enrollmentId: number;
	nilaiTugas?: number | null;
	nilaiUTS?: number | null;
	nilaiUAS?: number | null;
}

export interface KRSFormData {
	mahasiswaId: number;
	semesterId: number;
	status: StatusKRS;
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardStats {
	totalMahasiswa: number;
	totalDosen: number;
	totalMataKuliah: number;
	totalRuangKelas: number;
	activeSemester?: Semester;
	recentEnrollments: Enrollment[];
}

// ============================================
// Filter/Query Types
// ============================================

export interface ListQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

export interface MahasiswaFilter extends ListQueryParams {
	programStudiId?: number;
	angkatan?: number;
	status?: StatusMahasiswa;
}

export interface DosenFilter extends ListQueryParams {
	programStudiId?: number;
}

export interface MataKuliahFilter extends ListQueryParams {
	programStudiId?: number;
	semester?: number;
}

export interface RuangKelasFilter extends ListQueryParams {
	tipe?: TipeRuangKelas;
	status?: StatusRuangKelas;
	gedung?: string;
}

export interface EnrollmentFilter extends ListQueryParams {
	mahasiswaId?: number;
	mataKuliahId?: number;
	dosenId?: number;
	semesterId?: number;
	status?: StatusEnrollment;
	includeSemester?: boolean;
	includeNilai?: boolean;
}

export interface NilaiFilter extends ListQueryParams {
	semesterId?: number;
	mahasiswaId?: number;
	includeSemester?: boolean;
}

export interface KRSFilter extends ListQueryParams {
	mahasiswaId?: number;
	semesterId?: number;
	status?: StatusKRS;
	includeDetails?: boolean;
}

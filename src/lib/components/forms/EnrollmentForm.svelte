<script lang="ts">
	import EntityForm from '../EntityForm.svelte';
	import type {
		Dosen,
		Enrollment,
		EnrollmentFormData,
		Jadwal,
		Mahasiswa,
		MataKuliah,
		RuangKelas,
		RuangKelasAvailabilityItem,
		Semester
	} from '$lib/types';
	import { StatusEnrollment } from '$lib/types';
	import { mahasiswaService } from '$lib/api/services/mahasiswa';
	import { mataKuliahService } from '$lib/api/services/mataKuliah';
	import { dosenService } from '$lib/api/services/dosen';
	import { ruangKelasService } from '$lib/api/services/ruangKelas';
	import { jadwalService } from '$lib/api/services/jadwal';
	import { semesterService } from '$lib/api/services/semester';
	import { onMount } from 'svelte';

	interface Props {
		data?: Enrollment;
		onSubmit: (data: EnrollmentFormData) => void;
		onCancel: () => void;
		loading?: boolean;
	}

	let { data, onSubmit, onCancel, loading = false }: Props = $props();

	let mahasiswa = $state<Mahasiswa[]>([]);
	let mataKuliah = $state<MataKuliah[]>([]);
	let dosen = $state<Dosen[]>([]);
	let jadwal = $state<Jadwal[]>([]);
	let semester = $state<Semester[]>([]);
	let selectedMahasiswa = $state<Mahasiswa | null>(null);
	let selectedMataKuliah = $state<MataKuliah | null>(null);
	let selectedDosen = $state<Dosen | null>(null);
	let selectedJadwal = $state<Jadwal | null>(null);
	let selectedSemester = $state<Semester | null>(null);
	let selectedRoom = $state<RuangKelas | null>(null);
	let mahasiswaLoading = $state(false);
	let mataKuliahLoading = $state(false);
	let dosenLoading = $state(false);
	let jadwalLoading = $state(false);
	let semesterLoading = $state(false);
	let mahasiswaQuery = $state('');
	let mataKuliahQuery = $state('');
	let dosenQuery = $state('');
	let jadwalQuery = $state('');
	let semesterQuery = $state('');
	let loadingData = $state(true);
	let availableRooms = $state<RuangKelasAvailabilityItem[]>([]);
	let availabilityLoading = $state(false);
	let availabilityError = $state('');
	let availabilitySummary = $state<{
		totalCount: number;
		availableCount: number;
		unavailableCount: number;
	} | null>(null);

	// svelte-ignore state_referenced_locally
	let formData = $state<EnrollmentFormData>({
		mahasiswaId: data?.mahasiswaId || 0,
		mataKuliahId: data?.mataKuliahId || 0,
		dosenId: data?.dosenId || 0,
		ruangKelasId: data?.ruangKelasId || 0,
		jadwalId: data?.jadwalId || 0,
		semesterId: data?.semesterId || 0,
		status: data?.status || StatusEnrollment.ACTIVE
	});

	function mergeSelectedOption<T extends { id: number }>(items: T[], selected: T | null) {
		return selected && !items.some((item) => item.id === selected.id) ? [selected, ...items] : items;
	}

	async function loadMahasiswaOptions(query = mahasiswaQuery) {
		mahasiswaLoading = true;
		try {
			const response = await mahasiswaService.getAll({ limit: 20, search: query.trim() || undefined });
			if (response.success) {
				mahasiswa = mergeSelectedOption(response.data, selectedMahasiswa);
				if (!data && mahasiswa.length > 0 && formData.mahasiswaId === 0) {
					formData.mahasiswaId = mahasiswa[0].id;
					selectedMahasiswa = mahasiswa[0];
				}
			}
		} finally {
			mahasiswaLoading = false;
		}
	}

	async function loadMataKuliahOptions(query = mataKuliahQuery) {
		mataKuliahLoading = true;
		try {
			const response = await mataKuliahService.getAll({ limit: 20, search: query.trim() || undefined });
			if (response.success) {
				mataKuliah = mergeSelectedOption(response.data, selectedMataKuliah);
				if (!data && mataKuliah.length > 0 && formData.mataKuliahId === 0) {
					formData.mataKuliahId = mataKuliah[0].id;
					selectedMataKuliah = mataKuliah[0];
				}
			}
		} finally {
			mataKuliahLoading = false;
		}
	}

	async function loadDosenOptions(query = dosenQuery) {
		dosenLoading = true;
		try {
			const response = await dosenService.getAll({ limit: 20, search: query.trim() || undefined });
			if (response.success) {
				dosen = mergeSelectedOption(response.data, selectedDosen);
				if (!data && dosen.length > 0 && formData.dosenId === 0) {
					formData.dosenId = dosen[0].id;
					selectedDosen = dosen[0];
				}
			}
		} finally {
			dosenLoading = false;
		}
	}

	async function loadJadwalOptions(query = jadwalQuery) {
		jadwalLoading = true;
		try {
			const response = await jadwalService.getAll({ limit: 20, search: query.trim() || undefined });
			if (response.success) {
				jadwal = mergeSelectedOption(response.data, selectedJadwal);
				if (!data && jadwal.length > 0 && formData.jadwalId === 0) {
					formData.jadwalId = jadwal[0].id;
					selectedJadwal = jadwal[0];
				}
			}
		} finally {
			jadwalLoading = false;
		}
	}

	async function loadSemesterOptions(query = semesterQuery) {
		semesterLoading = true;
		try {
			const response = await semesterService.getAll({ limit: 20, search: query.trim() || undefined });
			if (response.success) {
				semester = mergeSelectedOption(response.data, selectedSemester);
				if (!data && semester.length > 0 && formData.semesterId === 0) {
					formData.semesterId = semester[0].id;
					selectedSemester = semester[0];
				}
			}
		} finally {
			semesterLoading = false;
		}
	}

	function handleMahasiswaSearch(query: string) {
		mahasiswaQuery = query;
		void loadMahasiswaOptions(query);
	}

	function handleMataKuliahSearch(query: string) {
		mataKuliahQuery = query;
		void loadMataKuliahOptions(query);
	}

	function handleDosenSearch(query: string) {
		dosenQuery = query;
		void loadDosenOptions(query);
	}

	function handleJadwalSearch(query: string) {
		jadwalQuery = query;
		void loadJadwalOptions(query);
	}

	function handleSemesterSearch(query: string) {
		semesterQuery = query;
		void loadSemesterOptions(query);
	}

	onMount(async () => {
		try {
			selectedMahasiswa = data?.mahasiswa ?? null;
			selectedMataKuliah = data?.mataKuliah ?? null;
			selectedDosen = data?.dosen ?? null;
			selectedJadwal = data?.jadwal ?? null;
			selectedSemester = data?.semester ?? null;
			selectedRoom = data?.ruangKelas ?? null;
			mahasiswa = selectedMahasiswa ? [selectedMahasiswa] : [];
			mataKuliah = selectedMataKuliah ? [selectedMataKuliah] : [];
			dosen = selectedDosen ? [selectedDosen] : [];
			jadwal = selectedJadwal ? [selectedJadwal] : [];
			semester = selectedSemester ? [selectedSemester] : [];

			if (data) {
				await loadAvailableRooms();
			}
		} finally {
			loadingData = false;
		}
	});

	$effect(() => {
		const currentMahasiswa = mahasiswa.find((item) => item.id === Number(formData.mahasiswaId));
		if (currentMahasiswa) selectedMahasiswa = currentMahasiswa;
	});

	$effect(() => {
		const currentMataKuliah = mataKuliah.find((item) => item.id === Number(formData.mataKuliahId));
		if (currentMataKuliah) selectedMataKuliah = currentMataKuliah;
	});

	$effect(() => {
		const currentDosen = dosen.find((item) => item.id === Number(formData.dosenId));
		if (currentDosen) selectedDosen = currentDosen;
	});

	$effect(() => {
		const currentJadwal = jadwal.find((item) => item.id === Number(formData.jadwalId));
		if (currentJadwal) selectedJadwal = currentJadwal;
	});

	$effect(() => {
		const currentSemester = semester.find((item) => item.id === Number(formData.semesterId));
		if (currentSemester) selectedSemester = currentSemester;
	});

	async function loadAvailableRooms() {
		if (!formData.jadwalId || !formData.semesterId) {
			availableRooms = [];
			availabilitySummary = null;
			availabilityError = '';
			return;
		}

		availabilityLoading = true;
		availabilityError = '';

		try {
			const response = await ruangKelasService.getAvailableRooms(formData.jadwalId, formData.semesterId, {
				excludeEnrollmentId: data?.id
			});

			if (!response.success) {
				availabilityError = response.error || 'Ketersediaan ruang belum berhasil dimuat.';
				availableRooms = [];
				availabilitySummary = null;
				return;
			}

			availabilitySummary = response.data.summary;

			const nextRooms: RuangKelasAvailabilityItem[] = response.data.rooms.filter(
				(room: RuangKelasAvailabilityItem) => room.available || room.id === formData.ruangKelasId
			);
			const currentSelectionExists = nextRooms.some((room) => room.id === formData.ruangKelasId);
			const firstAvailableRoom = nextRooms.find((room) => room.available);

			availableRooms = nextRooms;

			if (!currentSelectionExists) {
				formData.ruangKelasId = firstAvailableRoom?.id || 0;
			}
		} catch (error) {
			availabilityError = 'Koneksi bermasalah saat memeriksa ketersediaan ruang.';
			availableRooms = [];
			availabilitySummary = null;
		} finally {
			availabilityLoading = false;
		}
	}

	let watchedJadwalId = $derived(formData.jadwalId);
	let watchedSemesterId = $derived(formData.semesterId);

	$effect(() => {
		if (loadingData) {
			return;
		}

		const jadwalId = watchedJadwalId;
		const semesterId = watchedSemesterId;

		if (!jadwalId || !semesterId) {
			availableRooms = [];
			availabilitySummary = null;
			availabilityError = '';
			return;
		}

		void loadAvailableRooms();
	});

	const selectableRooms = $derived(
		availableRooms.length > 0
			? availableRooms
			: selectedRoom
				? [
					{
						...selectedRoom,
						available: false,
						conflicts: [],
						scheduledSections: 0,
						studentEnrollments: 0
					}
				]
				: []
	);

	const selectedRoomAvailability = $derived(
		availableRooms.find((room) => room.id === formData.ruangKelasId) ?? null
	);

	const fields = $derived([
		{
			name: 'mahasiswaId',
			label: 'Mahasiswa',
			type: 'async-select' as const,
			required: true,
			options: mahasiswa.map(m => ({ value: m.id, label: `${m.nim} - ${m.nama}` })),
			searchValue: mahasiswaQuery,
			searchPlaceholder: 'Cari mahasiswa berdasarkan NIM atau nama',
			loadingOptions: mahasiswaLoading,
			onSearch: handleMahasiswaSearch,
			emptyMessage: 'Tidak ada mahasiswa yang sesuai dengan pencarian.'
		},
		{
			name: 'mataKuliahId',
			label: 'Mata Kuliah',
			type: 'async-select' as const,
			required: true,
			options: mataKuliah.map(m => ({ value: m.id, label: `${m.kode} - ${m.nama}` })),
			searchValue: mataKuliahQuery,
			searchPlaceholder: 'Cari mata kuliah berdasarkan kode atau nama',
			loadingOptions: mataKuliahLoading,
			onSearch: handleMataKuliahSearch,
			emptyMessage: 'Tidak ada mata kuliah yang sesuai dengan pencarian.'
		},
		{
			name: 'dosenId',
			label: 'Dosen',
			type: 'async-select' as const,
			required: true,
			options: dosen.map(d => ({ value: d.id, label: `${d.nip} - ${d.nama}` })),
			searchValue: dosenQuery,
			searchPlaceholder: 'Cari dosen berdasarkan NIP atau nama',
			loadingOptions: dosenLoading,
			onSearch: handleDosenSearch,
			emptyMessage: 'Tidak ada dosen yang sesuai dengan pencarian.'
		},
		{
			name: 'ruangKelasId',
			label: 'Ruang Kelas',
			type: 'select' as const,
			required: true,
			options: selectableRooms.map((room) => ({
				value: room.id,
				label: `${room.kode} - ${room.nama}${room.available ? '' : ' (perlu penyesuaian)'}`
			}))
		},
		{
			name: 'jadwalId',
			label: 'Jadwal',
			type: 'async-select' as const,
			required: true,
			options: jadwal.map(j => ({ value: j.id, label: `${j.hari}, ${j.jamMulai} - ${j.jamSelesai}` })),
			searchValue: jadwalQuery,
			searchPlaceholder: 'Cari jadwal berdasarkan hari atau jam',
			loadingOptions: jadwalLoading,
			onSearch: handleJadwalSearch,
			emptyMessage: 'Tidak ada jadwal yang sesuai dengan pencarian.'
		},
		{
			name: 'semesterId',
			label: 'Semester',
			type: 'async-select' as const,
			required: true,
			options: semester.map(s => ({ value: s.id, label: `${s.tahunAjaran} ${s.semester}` })),
			searchValue: semesterQuery,
			searchPlaceholder: 'Cari semester berdasarkan tahun ajaran atau jenis semester',
			loadingOptions: semesterLoading,
			onSearch: handleSemesterSearch,
			emptyMessage: 'Tidak ada semester yang sesuai dengan pencarian.'
		},
		{
			name: 'status',
			label: 'Status',
			type: 'select' as const,
			required: true,
			options: [
				{ value: StatusEnrollment.ACTIVE, label: 'Aktif' },
				{ value: StatusEnrollment.COMPLETED, label: 'Selesai' },
				{ value: StatusEnrollment.DROPPED, label: 'Dibatalkan' }
			]
		}
	]);

	function handleSubmit() {
		if (formData.ruangKelasId === 0) {
			return;
		}

		onSubmit(formData);
	}
</script>

{#if loadingData}
	<div class="flex justify-center py-8" role="status">
		<span class="loading loading-spinner loading-lg text-primary" aria-hidden="true"></span>
		<span class="sr-only">Memuat...</span>
	</div>
{:else}
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
	<EntityForm {fields} bind:data={formData} {loading}>
		{#if formData.jadwalId && formData.semesterId}
			<div class="rounded-lg border border-base-300 bg-base-200 p-4 text-sm" aria-live="polite" aria-atomic="true">
				<p class="font-medium text-base-content">Ketersediaan ruang</p>
				{#if availabilityLoading}
					<p class="mt-2 text-muted">Memeriksa ruang yang tersedia untuk jadwal dan semester terpilih...</p>
				{:else if availabilityError}
					<p class="mt-2 text-error">{availabilityError}</p>
				{:else if availabilitySummary}
					<p class="mt-2 text-muted">
						{availabilitySummary.availableCount} dari {availabilitySummary.totalCount} ruang tersedia untuk slot ini.
					</p>
					{#if availabilitySummary.availableCount === 0}
						<p class="mt-2 text-error">Tidak ada ruang yang siap dipakai. Ubah jadwal atau semester terlebih dahulu.</p>
					{:else}
						<p class="mt-2 text-xs text-muted">Pilihan ruang dibatasi ke ruang yang masih tersedia.</p>
					{/if}

					{#if selectedRoomAvailability && !selectedRoomAvailability.available && selectedRoomAvailability.conflicts.length > 0}
						<p class="mt-3 text-xs text-warning">
							Ruang terpilih perlu ditinjau: {selectedRoomAvailability.conflicts.join('; ')}.
						</p>
					{/if}
				{/if}
			</div>
		{/if}

		<div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<button type="button" class="btn btn-ghost w-full sm:w-auto" onclick={onCancel} disabled={loading}>
				Batal
			</button>
			<button type="submit" class="btn btn-primary w-full sm:w-auto" disabled={loading || formData.ruangKelasId === 0}>
				{#if loading}
					<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
				{/if}
				{data ? 'Update' : 'Simpan'}
			</button>
		</div>
	</EntityForm>
	</form>
{/if}

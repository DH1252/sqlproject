<script lang="ts">
	import EntityForm from '../EntityForm.svelte';
	import type { Enrollment, EnrollmentFormData, Mahasiswa, MataKuliah, Dosen, RuangKelas, Jadwal, Semester } from '$lib/types';
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
	let ruangKelas = $state<RuangKelas[]>([]);
	let jadwal = $state<Jadwal[]>([]);
	let semester = $state<Semester[]>([]);
	let loadingData = $state(true);

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

	onMount(async () => {
		try {
			const [mRes, mkRes, dRes, rRes, jRes, sRes] = await Promise.all([
				mahasiswaService.getAll({ limit: 100 }),
				mataKuliahService.getAll({ limit: 100 }),
				dosenService.getAll({ limit: 100 }),
				ruangKelasService.getAll({ limit: 100 }),
				jadwalService.getAll({ limit: 100 }),
				semesterService.getAll({ limit: 100 })
			]);
			
			if (mRes.success) mahasiswa = mRes.data;
			if (mkRes.success) mataKuliah = mkRes.data;
			if (dRes.success) dosen = dRes.data;
			if (rRes.success) ruangKelas = rRes.data;
			if (jRes.success) jadwal = jRes.data;
			if (sRes.success) semester = sRes.data;

			// Set defaults if creating new
			if (!data) {
				if (mahasiswa.length > 0) formData.mahasiswaId = mahasiswa[0].id;
				if (mataKuliah.length > 0) formData.mataKuliahId = mataKuliah[0].id;
				if (dosen.length > 0) formData.dosenId = dosen[0].id;
				if (ruangKelas.length > 0) formData.ruangKelasId = ruangKelas[0].id;
				if (jadwal.length > 0) formData.jadwalId = jadwal[0].id;
				if (semester.length > 0) formData.semesterId = semester[0].id;
			}
		} finally {
			loadingData = false;
		}
	});

	const fields = $derived([
		{
			name: 'mahasiswaId',
			label: 'Mahasiswa',
			type: 'select' as const,
			required: true,
			options: mahasiswa.map(m => ({ value: m.id, label: `${m.nim} - ${m.nama}` }))
		},
		{
			name: 'mataKuliahId',
			label: 'Mata Kuliah',
			type: 'select' as const,
			required: true,
			options: mataKuliah.map(m => ({ value: m.id, label: `${m.kode} - ${m.nama}` }))
		},
		{
			name: 'dosenId',
			label: 'Dosen',
			type: 'select' as const,
			required: true,
			options: dosen.map(d => ({ value: d.id, label: `${d.nip} - ${d.nama}` }))
		},
		{
			name: 'ruangKelasId',
			label: 'Ruang Kelas',
			type: 'select' as const,
			required: true,
			options: ruangKelas.map(r => ({ value: r.id, label: `${r.kode} - ${r.nama}` }))
		},
		{
			name: 'jadwalId',
			label: 'Jadwal',
			type: 'select' as const,
			required: true,
			options: jadwal.map(j => ({ value: j.id, label: `${j.hari}, ${j.jamMulai} - ${j.jamSelesai}` }))
		},
		{
			name: 'semesterId',
			label: 'Semester',
			type: 'select' as const,
			required: true,
			options: semester.map(s => ({ value: s.id, label: `${s.tahunAjaran} ${s.semester}` }))
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
		onSubmit(formData);
	}
</script>

{#if loadingData}
	<div class="flex justify-center py-8">
		<span class="loading loading-spinner loading-lg text-primary"></span>
	</div>
{:else}
	<EntityForm {fields} bind:data={formData} {loading}>
		<div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<button type="button" class="btn btn-ghost w-full sm:w-auto" onclick={onCancel} disabled={loading}>
				Batal
			</button>
			<button type="button" class="btn btn-primary w-full sm:w-auto" onclick={handleSubmit} disabled={loading}>
				{#if loading}
					<span class="loading loading-spinner loading-sm"></span>
				{/if}
				{data ? 'Update' : 'Simpan'}
			</button>
		</div>
	</EntityForm>
{/if}

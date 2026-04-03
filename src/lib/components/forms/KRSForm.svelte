<script lang="ts">
	import EntityForm from '../EntityForm.svelte';
	import type { KRS, KRSFormData, Mahasiswa, Semester } from '$lib/types';
	import { StatusKRS } from '$lib/types';
	import { mahasiswaService } from '$lib/api/services/mahasiswa';
	import { semesterService } from '$lib/api/services/semester';
	import { fetchAllPages } from '$lib/utils/fetch-all-pages';
	import { onMount } from 'svelte';

	interface Props {
		data?: KRS;
		onSubmit: (data: KRSFormData) => void;
		onCancel: () => void;
		loading?: boolean;
	}

	let { data, onSubmit, onCancel, loading = false }: Props = $props();

	let mahasiswa = $state<Mahasiswa[]>([]);
	let semester = $state<Semester[]>([]);
	let loadingData = $state(true);
	let mahasiswaLoading = $state(false);
	let mahasiswaQuery = $state('');
	let selectedMahasiswa = $state<Mahasiswa | null>(null);

	// svelte-ignore state_referenced_locally
	let formData = $state<KRSFormData>({
		mahasiswaId: data?.mahasiswaId || 0,
		semesterId: data?.semesterId || 0,
		status: StatusKRS.DRAFT
	});

	onMount(async () => {
		if (data) {
			loadingData = false;
			return;
		}

		try {
			const sRes = await fetchAllPages((params) => semesterService.getAll(params));
			
			if (sRes.success) {
				semester = sRes.data;
				if (!data && semester.length > 0) {
					formData.semesterId = semester[0].id;
				}
			}
		} finally {
			loadingData = false;
		}
	});

	async function loadMahasiswaOptions(query = mahasiswaQuery) {
		mahasiswaLoading = true;
		try {
			const response = await mahasiswaService.getAll({ limit: 20, search: query.trim() || undefined });
			if (response.success) {
				const nextMahasiswa = response.data;
				mahasiswa = selectedMahasiswa && !nextMahasiswa.some((item) => item.id === selectedMahasiswa?.id)
					? [selectedMahasiswa, ...nextMahasiswa]
					: nextMahasiswa;
				if (!data && mahasiswa.length > 0 && formData.mahasiswaId === 0) {
					formData.mahasiswaId = mahasiswa[0].id;
					selectedMahasiswa = mahasiswa[0];
				}
			}

			return response;
		} finally {
			mahasiswaLoading = false;
		}
	}

	function handleMahasiswaSearch(query: string) {
		mahasiswaQuery = query;
		void loadMahasiswaOptions(query);
	}

	$effect(() => {
		const currentMahasiswa = mahasiswa.find((item) => item.id === Number(formData.mahasiswaId));
		if (currentMahasiswa) {
			selectedMahasiswa = currentMahasiswa;
		}
	});

	const fields = $derived([
		...(!data
			? [
				{
					name: 'mahasiswaId',
					label: 'Mahasiswa',
					type: 'async-select' as const,
					required: true,
					options: mahasiswa.map((item) => ({ value: item.id, label: `${item.nim} - ${item.nama}` })),
					searchValue: mahasiswaQuery,
					searchPlaceholder: 'Cari mahasiswa berdasarkan NIM atau nama',
					loadingOptions: mahasiswaLoading,
					onSearch: handleMahasiswaSearch,
					emptyMessage: 'Tidak ada mahasiswa yang sesuai dengan pencarian.'
				},
				{
					name: 'semesterId',
					label: 'Semester',
					type: 'select' as const,
					required: true,
					options: semester.map((item) => ({ value: item.id, label: `${item.tahunAjaran} ${item.semester}` }))
				}
			]
			: [])
	]);

	function handleSubmit() {
		if (!data && (mahasiswa.length === 0 || semester.length === 0)) {
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
		{#if data}
			<div class="space-y-4">
				<div class="alert alert-warning" role="status">
					<span>KRS yang ditolak dapat dikembalikan ke draft agar bisa diajukan ulang.</span>
				</div>
				<div class="rounded-lg border border-base-300 bg-base-200 p-4 text-sm">
					<p class="font-medium text-base-content">{data.mahasiswa?.nim} - {data.mahasiswa?.nama}</p>
					<p class="text-muted">{data.semester?.tahunAjaran} {data.semester?.semester}</p>
					<p class="mt-2 text-xs text-muted">Status saat ini: {data.status}</p>
				</div>
			</div>
		{:else if semester.length === 0}
			<div class="alert alert-info" role="status">
				<span>Data semester harus tersedia sebelum membuat KRS baru.</span>
			</div>
		{:else}
			<div class="rounded-lg border border-base-300 bg-base-200 p-4 text-sm text-muted">
				Cari mahasiswa terlebih dahulu, lalu pilih semester untuk membuat KRS baru dengan status draft.
			</div>
		{/if}

		<div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<button type="button" class="btn btn-ghost w-full sm:w-auto" onclick={onCancel} disabled={loading}>
				Batal
			</button>
			<button
				type="submit"
				class="btn btn-primary w-full sm:w-auto"
				disabled={loading || (!data && (formData.mahasiswaId === 0 || formData.semesterId === 0))}
			>
				{#if loading}
					<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
				{/if}
				{data ? 'Kembalikan ke Draft' : 'Simpan'}
			</button>
		</div>
	</EntityForm>
	</form>
{/if}

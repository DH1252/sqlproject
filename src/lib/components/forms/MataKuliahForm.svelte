<script lang="ts">
	import EntityForm from '../EntityForm.svelte';
	import type { MataKuliah, MataKuliahFormData, ProgramStudi } from '$lib/types';
	import { programStudiService } from '$lib/api/services/programStudi';
	import { onMount } from 'svelte';

	interface Props {
		data?: MataKuliah;
		onSubmit: (data: MataKuliahFormData) => void;
		onCancel: () => void;
		loading?: boolean;
	}

	let { data, onSubmit, onCancel, loading = false }: Props = $props();

	let programs = $state<ProgramStudi[]>([]);
	let programsLoading = $state(false);
	let programsError = $state('');
	let programQuery = $state('');
	let selectedProgram = $state<ProgramStudi | null>(null);

	// svelte-ignore state_referenced_locally
	let formData = $state<MataKuliahFormData>({
		kode: data?.kode || '',
		nama: data?.nama || '',
		sks: data?.sks || 3,
		semester: data?.semester || 1,
		programStudiId: data?.programStudiId || 0,
		deskripsi: data?.deskripsi || ''
	});

	async function loadPrograms(query = programQuery) {
		programsLoading = true;
		programsError = '';
		try {
			const response = await programStudiService.getAll({ limit: 20, search: query.trim() || undefined });
			if (response.success) {
				const nextPrograms = response.data;
				programs = selectedProgram && !nextPrograms.some((program) => program.id === selectedProgram?.id)
					? [selectedProgram, ...nextPrograms]
					: nextPrograms;
				if (!data && programs.length > 0 && formData.programStudiId === 0) {
					formData.programStudiId = programs[0].id;
					selectedProgram = programs[0];
				}
				return;
			}

			programsError = response.error || 'Daftar program studi belum berhasil dimuat.';
			programs = selectedProgram ? [selectedProgram] : [];
		} finally {
			programsLoading = false;
		}
	}

	async function ensureSelectedProgram() {
		if (!formData.programStudiId) return;

		const response = await programStudiService.getById(formData.programStudiId);
		if (response.success) {
			selectedProgram = response.data;
			programs = [response.data];
		}
	}

	function handleProgramSearch(query: string) {
		programQuery = query;
		void loadPrograms(query);
	}

	onMount(() => {
		if (data?.programStudiId) {
			void ensureSelectedProgram();
		}
	});

	$effect(() => {
		const currentProgram = programs.find((program) => program.id === Number(formData.programStudiId));
		if (currentProgram) {
			selectedProgram = currentProgram;
		}
	});

	const fields = $derived([
		{
			name: 'kode',
			label: 'Kode Mata Kuliah',
			type: 'text' as const,
			required: true,
			placeholder: 'Contoh: IF101'
		},
		{
			name: 'nama',
			label: 'Nama Mata Kuliah',
			type: 'text' as const,
			required: true,
			placeholder: 'Nama mata kuliah'
		},
		{
			name: 'sks',
			label: 'SKS',
			type: 'number' as const,
			required: true,
			min: 1,
			max: 6
		},
		{
			name: 'semester',
			label: 'Semester',
			type: 'number' as const,
			required: true,
			min: 1,
			max: 8
		},
		{
			name: 'programStudiId',
			label: 'Program Studi',
			type: 'async-select' as const,
			required: true,
			options: programs.map(p => ({ value: p.id, label: `${p.kode} - ${p.nama}` })),
			searchValue: programQuery,
			searchPlaceholder: 'Cari program studi berdasarkan nama atau kode',
			loadingOptions: programsLoading,
			onSearch: handleProgramSearch,
			emptyMessage: 'Tidak ada program studi yang sesuai dengan pencarian.'
		},
		{
			name: 'deskripsi',
			label: 'Deskripsi',
			type: 'textarea' as const,
			required: false,
			placeholder: 'Deskripsi mata kuliah (opsional)'
		}
	]);

	function handleSubmit() {
		onSubmit(formData);
	}
</script>

	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
	<EntityForm {fields} bind:data={formData} {loading}>
		<div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<button type="button" class="btn btn-ghost w-full sm:w-auto" onclick={onCancel} disabled={loading}>
				Batal
			</button>
			<button type="submit" class="btn btn-primary w-full sm:w-auto" disabled={loading || programsLoading || formData.programStudiId === 0}>
				{#if loading}
					<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
				{/if}
				{data ? 'Update' : 'Simpan'}
			</button>
		</div>
	</EntityForm>
	</form>

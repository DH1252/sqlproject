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

	// svelte-ignore state_referenced_locally
	let formData = $state<MataKuliahFormData>({
		kode: data?.kode || '',
		nama: data?.nama || '',
		sks: data?.sks || 3,
		semester: data?.semester || 1,
		programStudiId: data?.programStudiId || 0,
		deskripsi: data?.deskripsi || ''
	});

	onMount(async () => {
		programsLoading = true;
		try {
			const response = await programStudiService.getAll({ limit: 100 });
			if (response.success) {
				programs = response.data;
				if (!data && programs.length > 0 && formData.programStudiId === 0) {
					formData.programStudiId = programs[0].id;
				}
			}
		} finally {
			programsLoading = false;
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
			type: 'select' as const,
			required: true,
			options: programs.map(p => ({ value: p.id, label: `${p.kode} - ${p.nama}` }))
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

{#if programsLoading}
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

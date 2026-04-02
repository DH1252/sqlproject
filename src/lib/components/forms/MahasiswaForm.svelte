<script lang="ts">
	import EntityForm from '../EntityForm.svelte';
	import type { Mahasiswa, MahasiswaFormData, ProgramStudi } from '$lib/types';
	import { StatusMahasiswa } from '$lib/types';
	import { programStudiService } from '$lib/api/services/programStudi';
	import { onMount } from 'svelte';

	interface Props {
		data?: Mahasiswa;
		onSubmit: (data: MahasiswaFormData) => void;
		onCancel: () => void;
		loading?: boolean;
	}

	let { data, onSubmit, onCancel, loading = false }: Props = $props();

	let programs = $state<ProgramStudi[]>([]);
	let programsLoading = $state(false);

	// svelte-ignore state_referenced_locally
	let formData = $state<MahasiswaFormData>({
		nim: data?.nim || '',
		nama: data?.nama || '',
		email: data?.email || '',
		programStudiId: data?.programStudiId || 0,
		angkatan: data?.angkatan || new Date().getFullYear(),
		status: data?.status || StatusMahasiswa.ACTIVE
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
			name: 'nim',
			label: 'NIM',
			type: 'text' as const,
			required: true,
			placeholder: 'Contoh: 20210001'
		},
		{
			name: 'nama',
			label: 'Nama Lengkap',
			type: 'text' as const,
			required: true,
			placeholder: 'Nama mahasiswa'
		},
		{
			name: 'email',
			label: 'Email',
			type: 'email' as const,
			required: true,
			placeholder: 'email@student.umd.ac.id'
		},
		{
			name: 'programStudiId',
			label: 'Program Studi',
			type: 'select' as const,
			required: true,
			options: programs.map(p => ({ value: p.id, label: `${p.kode} - ${p.nama}` }))
		},
		{
			name: 'angkatan',
			label: 'Angkatan',
			type: 'number' as const,
			required: true,
			min: 2000,
			max: new Date().getFullYear() + 1
		},
		{
			name: 'status',
			label: 'Status',
			type: 'select' as const,
			required: true,
			options: [
				{ value: StatusMahasiswa.ACTIVE, label: 'Aktif' },
				{ value: StatusMahasiswa.INACTIVE, label: 'Tidak Aktif' },
				{ value: StatusMahasiswa.GRADUATED, label: 'Lulus' }
			]
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

<script lang="ts">
	import EntityForm from '../EntityForm.svelte';
	import type { Semester, SemesterFormData } from '$lib/types';
	import { JenisSemester } from '$lib/types';

	interface Props {
		data?: Semester;
		onSubmit: (data: SemesterFormData) => void;
		onCancel: () => void;
		loading?: boolean;
	}

	let { data, onSubmit, onCancel, loading = false }: Props = $props();

	// svelte-ignore state_referenced_locally
	let formData = $state<SemesterFormData>({
		tahunAjaran: data?.tahunAjaran || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
		semester: data?.semester || JenisSemester.GANJIL,
		isActive: data?.isActive || false
	});

	const fields = [
		{
			name: 'tahunAjaran',
			label: 'Tahun Ajaran',
			type: 'text' as const,
			required: true,
			placeholder: 'Contoh: 2024/2025'
		},
		{
			name: 'semester',
			label: 'Semester',
			type: 'select' as const,
			required: true,
			options: [
				{ value: JenisSemester.GANJIL, label: 'Ganjil' },
				{ value: JenisSemester.GENAP, label: 'Genap' }
			]
		},
		{
			name: 'isActive',
			label: 'Aktifkan Semester',
			type: 'checkbox' as const,
			required: false,
			placeholder: 'Jadikan semester aktif'
		}
	];

	function handleSubmit() {
		onSubmit(formData);
	}
</script>

<EntityForm {fields} bind:data={formData} {loading}>
	{#if formData.isActive && !data?.isActive}
		<div class="alert alert-warning mt-4">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
			<span>Semester lain akan dinonaktifkan jika semester ini diaktifkan.</span>
		</div>
	{/if}
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

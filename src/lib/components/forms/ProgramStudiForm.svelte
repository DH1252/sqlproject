<script lang="ts">
	import EntityForm from '../EntityForm.svelte';
	import type { ProgramStudi, ProgramStudiFormData } from '$lib/types';

	interface Props {
		data?: ProgramStudi;
		onSubmit: (data: ProgramStudiFormData) => void;
		onCancel: () => void;
		loading?: boolean;
	}

	let { data, onSubmit, onCancel, loading = false }: Props = $props();

	// svelte-ignore state_referenced_locally
	let formData = $state<ProgramStudiFormData>({
		kode: data?.kode || '',
		nama: data?.nama || '',
		jenjang: data?.jenjang || 'S1'
	});

	const fields = [
		{
			name: 'kode',
			label: 'Kode Program Studi',
			type: 'text' as const,
			required: true,
			placeholder: 'Contoh: TI'
		},
		{
			name: 'nama',
			label: 'Nama Program Studi',
			type: 'text' as const,
			required: true,
			placeholder: 'Contoh: Teknik Informatika'
		},
		{
			name: 'jenjang',
			label: 'Jenjang',
			type: 'select' as const,
			required: true,
			options: [
				{ value: 'S1', label: 'S1 (Sarjana)' },
				{ value: 'S2', label: 'S2 (Magister)' },
				{ value: 'S3', label: 'S3 (Doktor)' }
			]
		}
	];

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
		<button type="submit" class="btn btn-primary w-full sm:w-auto" disabled={loading}>
			{#if loading}
				<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
			{/if}
			{data ? 'Update' : 'Simpan'}
		</button>
	</div>
</EntityForm>
</form>

<script lang="ts">
	import EntityForm from '../EntityForm.svelte';
	import type { RuangKelas, RuangKelasFormData } from '$lib/types';
	import { TipeRuangKelas, StatusRuangKelas } from '$lib/types';

	interface Props {
		data?: RuangKelas;
		onSubmit: (data: RuangKelasFormData) => void;
		onCancel: () => void;
		loading?: boolean;
	}

	let { data, onSubmit, onCancel, loading = false }: Props = $props();

	// svelte-ignore state_referenced_locally
	let formData = $state<RuangKelasFormData>({
		kode: data?.kode || '',
		nama: data?.nama || '',
		tipe: data?.tipe || TipeRuangKelas.REGULER,
		kapasitas: data?.kapasitas || 30,
		hasProyektor: data?.hasProyektor || false,
		hasAC: data?.hasAC || false,
		gedung: data?.gedung || '',
		lantai: data?.lantai || 1,
		status: data?.status || StatusRuangKelas.AVAILABLE
	});

	const fields = [
		{
			name: 'kode',
			label: 'Kode Ruangan',
			type: 'text' as const,
			required: true,
			placeholder: 'Contoh: R101'
		},
		{
			name: 'nama',
			label: 'Nama Ruangan',
			type: 'text' as const,
			required: true,
			placeholder: 'Nama ruangan'
		},
		{
			name: 'tipe',
			label: 'Tipe Ruangan',
			type: 'select' as const,
			required: true,
			options: [
				{ value: TipeRuangKelas.REGULER, label: 'Reguler' },
				{ value: TipeRuangKelas.LAB_KOMPUTER, label: 'Lab Komputer' },
				{ value: TipeRuangKelas.LAB_BAHASA, label: 'Lab Bahasa' },
				{ value: TipeRuangKelas.AUDITORIUM, label: 'Auditorium' }
			]
		},
		{
			name: 'kapasitas',
			label: 'Kapasitas',
			type: 'number' as const,
			required: true,
			min: 1,
			max: 500
		},
		{
			name: 'gedung',
			label: 'Gedung',
			type: 'text' as const,
			required: true,
			placeholder: 'Contoh: Gedung A'
		},
		{
			name: 'lantai',
			label: 'Lantai',
			type: 'number' as const,
			required: true,
			min: 1,
			max: 20
		},
		{
			name: 'hasProyektor',
			label: 'Memiliki Proyektor',
			type: 'checkbox' as const,
			required: false,
			placeholder: 'Ada proyektor'
		},
		{
			name: 'hasAC',
			label: 'Memiliki AC',
			type: 'checkbox' as const,
			required: false,
			placeholder: 'Ada AC'
		},
		{
			name: 'status',
			label: 'Status',
			type: 'select' as const,
			required: true,
			options: [
				{ value: StatusRuangKelas.AVAILABLE, label: 'Tersedia' },
				{ value: StatusRuangKelas.MAINTENANCE, label: 'Dalam Perbaikan' },
				{ value: StatusRuangKelas.UNAVAILABLE, label: 'Tidak Tersedia' }
			]
		}
	];

	function handleSubmit() {
		onSubmit(formData);
	}
</script>

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

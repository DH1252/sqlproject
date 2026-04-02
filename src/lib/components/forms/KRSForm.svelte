<script lang="ts">
	import EntityForm from '../EntityForm.svelte';
	import type { KRS, KRSFormData, Mahasiswa, Semester } from '$lib/types';
	import { StatusKRS } from '$lib/types';
	import { mahasiswaService } from '$lib/api/services/mahasiswa';
	import { semesterService } from '$lib/api/services/semester';
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

	// svelte-ignore state_referenced_locally
	let formData = $state<KRSFormData>({
		mahasiswaId: data?.mahasiswaId || 0,
		semesterId: data?.semesterId || 0,
		status: data?.status || StatusKRS.DRAFT
	});

	onMount(async () => {
		try {
			const [mRes, sRes] = await Promise.all([
				mahasiswaService.getAll({ limit: 100 }),
				semesterService.getAll({ limit: 100 })
			]);
			
			if (mRes.success) {
				mahasiswa = mRes.data;
				if (!data && mahasiswa.length > 0) {
					formData.mahasiswaId = mahasiswa[0].id;
				}
			}
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

	const fields = $derived([
		{
			name: 'mahasiswaId',
			label: 'Mahasiswa',
			type: 'select' as const,
			required: true,
			options: mahasiswa.map(m => ({ value: m.id, label: `${m.nim} - ${m.nama}` }))
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
				{ value: StatusKRS.DRAFT, label: 'Draft' },
				{ value: StatusKRS.SUBMITTED, label: 'Diajukan' },
				{ value: StatusKRS.APPROVED, label: 'Disetujui' },
				{ value: StatusKRS.REJECTED, label: 'Ditolak' }
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

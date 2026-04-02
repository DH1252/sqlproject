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
		status: StatusKRS.DRAFT
	});

	onMount(async () => {
		if (data) {
			loadingData = false;
			return;
		}

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
		...(!data
			? [
				{
					name: 'mahasiswaId',
					label: 'Mahasiswa',
					type: 'select' as const,
					required: true,
					options: mahasiswa.map((item) => ({ value: item.id, label: `${item.nim} - ${item.nama}` }))
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
	<div class="flex justify-center py-8">
		<span class="loading loading-spinner loading-lg text-primary"></span>
	</div>
{:else}
	<EntityForm {fields} bind:data={formData} {loading}>
		{#if data}
			<div class="space-y-4">
				<div class="alert alert-warning">
					<span>KRS yang ditolak dapat dikembalikan ke draft agar bisa diajukan ulang.</span>
				</div>
				<div class="rounded-lg border border-base-300 bg-base-200 p-4 text-sm">
					<p class="font-medium text-base-content">{data.mahasiswa?.nim} - {data.mahasiswa?.nama}</p>
					<p class="text-muted">{data.semester?.tahunAjaran} {data.semester?.semester}</p>
					<p class="mt-2 text-xs text-muted">Status saat ini: {data.status}</p>
				</div>
			</div>
		{:else if mahasiswa.length === 0 || semester.length === 0}
			<div class="alert alert-info">
				<span>Data mahasiswa dan semester harus tersedia sebelum membuat KRS baru.</span>
			</div>
		{:else}
			<div class="rounded-lg border border-base-300 bg-base-200 p-4 text-sm text-muted">
				KRS baru selalu dibuat dengan status draft.
			</div>
		{/if}

		<div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<button type="button" class="btn btn-ghost w-full sm:w-auto" onclick={onCancel} disabled={loading}>
				Batal
			</button>
			<button
				type="button"
				class="btn btn-primary w-full sm:w-auto"
				onclick={handleSubmit}
				disabled={loading || (!data && (mahasiswa.length === 0 || semester.length === 0))}
			>
				{#if loading}
					<span class="loading loading-spinner loading-sm"></span>
				{/if}
				{data ? 'Kembalikan ke Draft' : 'Simpan'}
			</button>
		</div>
	</EntityForm>
{/if}

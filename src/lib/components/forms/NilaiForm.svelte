<script lang="ts">
	import EntityForm from '../EntityForm.svelte';
	import type { Nilai, NilaiFormData, Enrollment } from '$lib/types';
	import { enrollmentService } from '$lib/api/services/enrollment';
	import { calculateGrade } from '$lib/utils/grade-calculator';
	import { onMount } from 'svelte';

	interface Props {
		data?: Nilai;
		onSubmit: (data: NilaiFormData) => void;
		onCancel: () => void;
		loading?: boolean;
	}

	let { data, onSubmit, onCancel, loading = false }: Props = $props();

	let enrollments = $state<Enrollment[]>([]);
	let loadingData = $state(true);

	// svelte-ignore state_referenced_locally
	let formData = $state<NilaiFormData>({
		enrollmentId: data?.enrollmentId || 0,
		nilaiTugas: data?.nilaiTugas || 0,
		nilaiUTS: data?.nilaiUTS || 0,
		nilaiUAS: data?.nilaiUAS || 0
	});

	let gradePreview = $derived(() =>
		calculateGrade({
			nilaiTugas: formData.nilaiTugas ?? null,
			nilaiUTS: formData.nilaiUTS ?? null,
			nilaiUAS: formData.nilaiUAS ?? null
		})
	);

	let nilaiTotal = $derived(() => gradePreview()?.nilaiTotal?.toFixed(2) ?? '-');
	let hurufMutu = $derived(() => gradePreview()?.hurufMutu ?? '-');

	onMount(async () => {
		try {
			const response = await enrollmentService.getAll({
				limit: 100,
				includeSemester: true,
				includeNilai: true
			});
			if (response.success) {
				enrollments = response.data.filter((enrollment: Enrollment) => !enrollment.nilai || enrollment.id === data?.enrollmentId);
				if (!data && enrollments.length > 0) {
					formData.enrollmentId = enrollments[0].id;
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
					name: 'enrollmentId',
					label: 'Enrollment',
					type: 'select' as const,
					required: true,
					options: enrollments.map((enrollment) => ({
						value: enrollment.id,
						label: `${enrollment.mahasiswa?.nim} - ${enrollment.mahasiswa?.nama} - ${enrollment.mataKuliah?.nama} (${enrollment.semester?.tahunAjaran})`
					}))
				}
			]
			: []),
		{
			name: 'nilaiTugas',
			label: 'Nilai Tugas (30%)',
			type: 'number' as const,
			required: true,
			min: 0,
			max: 100
		},
		{
			name: 'nilaiUTS',
			label: 'Nilai UTS (30%)',
			type: 'number' as const,
			required: true,
			min: 0,
			max: 100
		},
		{
			name: 'nilaiUAS',
			label: 'Nilai UAS (40%)',
			type: 'number' as const,
			required: true,
			min: 0,
			max: 100
		}
	]);

	function handleSubmit() {
		if (!data && enrollments.length === 0) {
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
			<div class="rounded-lg border border-base-300 bg-base-200 p-4">
				<p class="text-sm font-medium">Enrollment</p>
				<p class="mt-2 text-sm font-medium text-base-content">
					{data.enrollment?.mahasiswa?.nim} - {data.enrollment?.mahasiswa?.nama}
				</p>
				<p class="text-sm text-muted">
					{data.enrollment?.mataKuliah?.kode} - {data.enrollment?.mataKuliah?.nama}
					{#if data.enrollment?.semester}
						 • {data.enrollment.semester.tahunAjaran} {data.enrollment.semester.semester}
					{/if}
				</p>
				<p class="mt-2 text-xs text-muted">Enrollment tidak bisa diubah saat edit nilai.</p>
			</div>
		{:else if enrollments.length === 0}
			<div class="alert alert-info">
				<span>Semua enrollment sudah memiliki nilai. Hapus nilai lama atau buat enrollment baru terlebih dahulu.</span>
			</div>
		{/if}

		<div class="bg-base-200 p-4 rounded-lg mt-4">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<span class="text-sm text-muted">Nilai Total</span>
					<div class="text-2xl font-bold">{nilaiTotal()}</div>
				</div>
				<div>
					<span class="text-sm text-muted">Huruf Mutu</span>
					<div class="text-2xl font-bold text-primary">{hurufMutu()}</div>
				</div>
			</div>
		</div>
		<div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<button type="button" class="btn btn-ghost w-full sm:w-auto" onclick={onCancel} disabled={loading}>
				Batal
			</button>
			<button
				type="button"
				class="btn btn-primary w-full sm:w-auto"
				onclick={handleSubmit}
				disabled={loading || (!data && enrollments.length === 0)}
			>
				{#if loading}
					<span class="loading loading-spinner loading-sm"></span>
				{/if}
				{data ? 'Update' : 'Simpan'}
			</button>
		</div>
	</EntityForm>
{/if}

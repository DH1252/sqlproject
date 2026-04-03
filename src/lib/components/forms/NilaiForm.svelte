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
	let loadingData = $state(false);
	let enrollmentLoading = $state(false);
	let enrollmentQuery = $state('');
	let selectedEnrollment = $state<Enrollment | null>(null);

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
		if (data?.enrollmentId) {
			loadingData = true;
			try {
				const selectedResponse = await enrollmentService.getById(data.enrollmentId);
				if (selectedResponse.success) {
					selectedEnrollment = selectedResponse.data;
					enrollments = [selectedResponse.data];
				}
			} finally {
				loadingData = false;
			}
		}
	});

	async function loadEnrollmentOptions(query = enrollmentQuery) {
		enrollmentLoading = true;
		try {
			const response = await enrollmentService.getAll({
				limit: 20,
				search: query.trim() || undefined,
				includeSemester: true,
				includeNilai: true
			});

			if (response.success) {
				const nextEnrollments = response.data.filter((enrollment: Enrollment) => !enrollment.nilai || enrollment.id === data?.enrollmentId);
				enrollments = selectedEnrollment && !nextEnrollments.some((enrollment) => enrollment.id === selectedEnrollment?.id)
					? [selectedEnrollment, ...nextEnrollments]
					: nextEnrollments;
				if (!data && enrollments.length > 0 && formData.enrollmentId === 0) {
					formData.enrollmentId = enrollments[0].id;
					selectedEnrollment = enrollments[0];
				}
			}

			return response;
		} finally {
			enrollmentLoading = false;
		}
	}

	function handleEnrollmentSearch(query: string) {
		enrollmentQuery = query;
		void loadEnrollmentOptions(query);
	}

	$effect(() => {
		const currentEnrollment = enrollments.find((enrollment) => enrollment.id === Number(formData.enrollmentId));
		if (currentEnrollment) {
			selectedEnrollment = currentEnrollment;
		}
	});

	const fields = $derived([
		...(!data
			? [
				{
					name: 'enrollmentId',
					label: 'Enrollment',
					type: 'async-select' as const,
					required: true,
					options: enrollments.map((enrollment) => ({
						value: enrollment.id,
						label: `${enrollment.mahasiswa?.nim} - ${enrollment.mahasiswa?.nama} - ${enrollment.mataKuliah?.nama} (${enrollment.semester?.tahunAjaran})`
					})),
					searchValue: enrollmentQuery,
					searchPlaceholder: 'Cari enrollment berdasarkan mahasiswa, dosen, atau mata kuliah',
					loadingOptions: enrollmentLoading,
					onSearch: handleEnrollmentSearch,
					emptyMessage: 'Tidak ada enrollment yang sesuai dengan pencarian.'
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
	<div class="flex justify-center py-8" role="status">
		<span class="loading loading-spinner loading-lg text-primary" aria-hidden="true"></span>
		<span class="sr-only">Memuat...</span>
	</div>
{:else}
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
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
			<div class="alert alert-info" role="status">
				<span>{enrollmentQuery ? 'Tidak ada enrollment yang sesuai dengan pencarian.' : 'Cari enrollment terlebih dahulu untuk mulai mengisi nilai.'}</span>
			</div>
		{/if}

		<div class="bg-base-200 p-4 rounded-lg mt-4" aria-live="polite" aria-atomic="true">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<span class="text-sm text-muted">Nilai Total</span>
					<div class="text-2xl font-semibold">{nilaiTotal()}</div>
				</div>
				<div>
					<span class="text-sm text-muted">Huruf Mutu</span>
					<div class="text-2xl font-semibold text-base-content">{hurufMutu()}</div>
				</div>
			</div>
		</div>
		<div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<button type="button" class="btn btn-ghost w-full sm:w-auto" onclick={onCancel} disabled={loading}>
				Batal
			</button>
			<button
				type="submit"
				class="btn btn-primary w-full sm:w-auto"
				disabled={loading || (!data && formData.enrollmentId === 0)}
			>
				{#if loading}
					<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
				{/if}
				{data ? 'Update' : 'Simpan'}
			</button>
		</div>
	</EntityForm>
	</form>
{/if}

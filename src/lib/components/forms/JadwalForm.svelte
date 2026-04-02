<script lang="ts">
	import EntityForm from '../EntityForm.svelte';
	import type { Jadwal, JadwalFormData } from '$lib/types';
	import { Hari } from '$lib/types';

	interface Props {
		data?: Jadwal;
		onSubmit: (data: JadwalFormData) => void;
		onCancel: () => void;
		loading?: boolean;
	}

	let { data, onSubmit, onCancel, loading = false }: Props = $props();

	// svelte-ignore state_referenced_locally
	let formData = $state<JadwalFormData>({
		hari: data?.hari || Hari.SENIN,
		jamMulai: data?.jamMulai || '08:00',
		jamSelesai: data?.jamSelesai || '10:00'
	});

	const fields = [
		{
			name: 'hari',
			label: 'Hari',
			type: 'select' as const,
			required: true,
			options: [
				{ value: Hari.SENIN, label: 'Senin' },
				{ value: Hari.SELASA, label: 'Selasa' },
				{ value: Hari.RABU, label: 'Rabu' },
				{ value: Hari.KAMIS, label: 'Kamis' },
				{ value: Hari.JUMAT, label: 'Jumat' },
				{ value: Hari.SABTU, label: 'Sabtu' },
				{ value: Hari.MINGGU, label: 'Minggu' }
			]
		},
		{
			name: 'jamMulai',
			label: 'Jam Mulai',
			type: 'text' as const,
			required: true,
			placeholder: 'HH:MM'
		},
		{
			name: 'jamSelesai',
			label: 'Jam Selesai',
			type: 'text' as const,
			required: true,
			placeholder: 'HH:MM'
		}
	];

	function handleSubmit() {
		// Validate time format
		const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
		if (!timeRegex.test(formData.jamMulai) || !timeRegex.test(formData.jamSelesai)) {
			alert('Masukkan jam dengan format HH:MM, misalnya 08:30.');
			return;
		}
		
		// Validate jamSelesai > jamMulai
		const [startHour, startMin] = formData.jamMulai.split(':').map(Number);
		const [endHour, endMin] = formData.jamSelesai.split(':').map(Number);
		const startMinutes = startHour * 60 + startMin;
		const endMinutes = endHour * 60 + endMin;
		
		if (endMinutes <= startMinutes) {
			alert('Pilih jam selesai yang lebih besar dari jam mulai.');
			return;
		}
		
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

<script lang="ts">
	import EntityForm from '../EntityForm.svelte';
	import NoticeBanner from '$lib/components/NoticeBanner.svelte';
	import type { Jadwal, JadwalFormData } from '$lib/types';
 	import type { NoticeMessage } from '$lib/types/notice';
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
	let formNotice = $state<NoticeMessage | null>(null);
	let fieldErrors = $state<Record<string, string>>({});

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
			placeholder: 'HH:MM',
			helperText: 'Gunakan format HH:MM, misalnya 08:30.'
		},
		{
			name: 'jamSelesai',
			label: 'Jam Selesai',
			type: 'text' as const,
			required: true,
			placeholder: 'HH:MM',
			helperText: 'Gunakan format HH:MM dan pilih waktu setelah jam mulai.'
		}
	];

	function handleSubmit() {
		formNotice = null;
		fieldErrors = {};

		const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
		if (!timeRegex.test(formData.jamMulai) || !timeRegex.test(formData.jamSelesai)) {
			fieldErrors = {
				...(!timeRegex.test(formData.jamMulai) ? { jamMulai: 'Masukkan jam mulai dengan format HH:MM.' } : {}),
				...(!timeRegex.test(formData.jamSelesai) ? { jamSelesai: 'Masukkan jam selesai dengan format HH:MM.' } : {})
			};
			formNotice = {
				tone: 'warning',
				title: 'Format jam belum sesuai.',
				description: 'Masukkan jam dengan format HH:MM, misalnya 08:30.'
			};
			return;
		}
		
		const [startHour, startMin] = formData.jamMulai.split(':').map(Number);
		const [endHour, endMin] = formData.jamSelesai.split(':').map(Number);
		const startMinutes = startHour * 60 + startMin;
		const endMinutes = endHour * 60 + endMin;
		
		if (endMinutes <= startMinutes) {
			fieldErrors = {
				jamSelesai: 'Jam selesai harus lebih besar dari jam mulai.'
			};
			formNotice = {
				tone: 'warning',
				title: 'Rentang waktu belum valid.',
				description: 'Pilih jam selesai yang lebih besar dari jam mulai.'
			};
			return;
		}
		
		onSubmit(formData);
	}
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
<EntityForm {fields} bind:data={formData} errors={fieldErrors} {loading}>
	{#if formNotice}
		<NoticeBanner notice={formNotice} />
	{/if}
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

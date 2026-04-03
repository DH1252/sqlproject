<script lang="ts">
	import Modal from './Modal.svelte';
	import NoticeBanner from './NoticeBanner.svelte';
	import type { NoticeMessage } from '$lib/types/notice';

	interface Props {
		open: boolean;
		title: string;
		description: string;
		confirmLabel: string;
		onConfirm: () => void;
		onCancel?: () => void;
		loading?: boolean;
		confirmTone?: 'primary' | 'error' | 'warning' | 'success' | 'info';
		notice?: NoticeMessage | null;
		summary?: Array<{ label: string; value: string }>;
	}

	let {
		open,
		title,
		description,
		confirmLabel,
		onConfirm,
		onCancel,
		loading = false,
		confirmTone = 'primary',
		notice = null,
		summary = []
	}: Props = $props();
</script>

<Modal {open} {title} onClose={loading ? undefined : onCancel} size="sm">
	<div class="space-y-4">
		{#if notice}
			<NoticeBanner {notice} />
		{/if}

		<p class="text-sm leading-6 text-base-content">{description}</p>

		{#if summary.length > 0}
			<div class="rounded-lg border border-base-300/70 bg-base-200 p-4">
				<dl class="space-y-2 text-sm">
					{#each summary as item}
						<div>
							<dt class="text-xs font-medium uppercase tracking-[0.14em] text-subtle">{item.label}</dt>
							<dd class="mt-1 font-medium text-base-content break-words">{item.value}</dd>
						</div>
					{/each}
				</dl>
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<button type="button" class="btn btn-ghost" onclick={onCancel} disabled={loading}>Batal</button>
		<button type="button" class={`btn btn-${confirmTone}`} onclick={onConfirm} disabled={loading}>
			{#if loading}
				<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
			{/if}
			{confirmLabel}
		</button>
	{/snippet}
</Modal>

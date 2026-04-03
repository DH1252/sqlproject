<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { NoticeMessage, NoticeTone } from '$lib/types/notice';

	interface Props {
		notice: NoticeMessage;
		onDismiss?: () => void;
		actions?: Snippet;
	}

	let { notice, onDismiss, actions }: Props = $props();

	function toneClass(tone: NoticeTone) {
		switch (tone) {
			case 'success':
				return 'alert-success';
			case 'warning':
				return 'alert-warning';
			case 'info':
				return 'alert-info';
			default:
				return 'alert-error';
		}
	}
</script>

<div class={`alert ${toneClass(notice.tone)}`} role={notice.tone === 'error' ? 'alert' : 'status'}>
	<div class="space-y-1">
		<div class="font-medium">{notice.title}</div>
		{#if notice.description}
			<div class="text-sm">{notice.description}</div>
		{/if}
	</div>
	<div class="flex items-center gap-2">
		{#if actions}
			{@render actions()}
		{/if}
		{#if onDismiss}
			<button type="button" class="btn btn-sm btn-ghost" onclick={onDismiss}>Tutup</button>
		{/if}
	</div>
</div>

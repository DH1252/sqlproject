<script lang="ts">
	interface Props {
		title: string;
		description?: string;
		actionLabel?: string;
		actionDisabled?: boolean;
		onAction?: () => void;
	}

	let { title, description = '', actionLabel, actionDisabled = false, onAction }: Props = $props();
</script>

<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
	<div>
		<h1 class="text-2xl font-semibold">{title}</h1>
		{#if description}
			<p class="text-muted">{description}</p>
		{/if}
	</div>

	{#if actionLabel}
		<button class="btn btn-primary w-full sm:w-auto" onclick={onAction} disabled={actionDisabled}>
			<svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			{actionLabel}
		</button>
	{/if}
</div>

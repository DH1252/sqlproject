<script lang="ts">
	import { tick } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		children: Snippet;
		footer?: Snippet;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		onClose?: () => void;
	}

	let { open, title, children, footer, size = 'md', onClose }: Props = $props();
	let panelEl = $state<HTMLDivElement | null>(null);
	let lastFocusedElement: HTMLElement | null = null;
	let previousBodyOverflow = '';
	let titleId = $derived(`modal-title-${title.toLowerCase().replace(/[^a-z0-9]+/gi, '-') || 'dialog'}`);

	const sizeClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-2xl'
	};

	function getFocusableElements(container: HTMLElement) {
		return Array.from(
			container.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)
		).filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true');
	}

	async function activateDialog() {
		if (typeof document === 'undefined') return;

		previousBodyOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

		await tick();

		if (!panelEl) return;

		const [firstFocusable] = getFocusableElements(panelEl);
		(firstFocusable ?? panelEl).focus();
	}

	function focusFallbackTarget() {
		if (typeof document === 'undefined') return;

		const fallbackTarget =
			document.getElementById('main-content') ??
			document.querySelector<HTMLElement>('main, h1');

		if (!fallbackTarget) return;

		const restoreTabIndex = !fallbackTarget.hasAttribute('tabindex');
		if (restoreTabIndex) {
			fallbackTarget.setAttribute('tabindex', '-1');
			fallbackTarget.addEventListener(
				'blur',
				() => fallbackTarget.removeAttribute('tabindex'),
				{ once: true }
			);
		}

		fallbackTarget.focus();
	}

	function deactivateDialog() {
		if (typeof document === 'undefined') return;

		document.body.style.overflow = previousBodyOverflow;

		if (lastFocusedElement?.isConnected) {
			lastFocusedElement.focus();
			return;
		}

		focusFallbackTarget();
	}

	function trapFocus(event: KeyboardEvent) {
		if (!panelEl) return;

		const focusableElements = getFocusableElements(panelEl);
		if (focusableElements.length === 0) {
			event.preventDefault();
			panelEl.focus();
			return;
		}

		const firstFocusable = focusableElements[0];
		const lastFocusable = focusableElements[focusableElements.length - 1];
		const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

		if (!activeElement || !panelEl.contains(activeElement)) {
			event.preventDefault();
			firstFocusable.focus();
			return;
		}

		if (event.shiftKey && activeElement === firstFocusable) {
			event.preventDefault();
			lastFocusable.focus();
		}

		if (!event.shiftKey && activeElement === lastFocusable) {
			event.preventDefault();
			firstFocusable.focus();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!open) return;

		if (event.key === 'Escape' && onClose) {
			event.preventDefault();
			onClose();
		}

		if (event.key === 'Tab') {
			trapFocus(event);
		}
	}

	$effect(() => {
		if (!open) return;

		void activateDialog();

		return () => {
			deactivateDialog();
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6">
		{#if onClose}
			<button type="button" class="app-scrim fixed inset-0" onclick={onClose} aria-label={`Tutup dialog ${title}`}></button>
		{:else}
			<div class="app-scrim fixed inset-0"></div>
		{/if}
		<div
			bind:this={panelEl}
			class="floating-panel relative flex max-h-[min(90vh,42rem)] w-full flex-col overflow-hidden rounded-lg bg-base-100 {sizeClasses[size]}"
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			tabindex="-1"
		>
			<div class="flex justify-between items-center p-4 border-b">
				<h3 id={titleId} class="text-lg font-semibold">{title}</h3>
				{#if onClose}
				<button type="button" class="btn btn-sm btn-ghost btn-circle touch-target" onclick={onClose} aria-label="Tutup dialog">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
					</button>
				{/if}
			</div>
			<div class="overflow-y-auto p-4">
				{@render children()}
			</div>
			{#if footer}
				<div class="flex flex-col-reverse gap-2 p-4 border-t sm:flex-row sm:justify-end">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}

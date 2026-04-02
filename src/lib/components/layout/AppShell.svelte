<script lang="ts">
	import { tick } from 'svelte';
	import Sidebar from './Sidebar.svelte';
	import TopBar from './TopBar.svelte';

	interface Props {
		children: import('svelte').Snippet;
		title?: string;
		theme?: 'light' | 'dark';
		toggleTheme?: () => void;
	}

	let { children, title = '', theme = 'light', toggleTheme }: Props = $props();

	let sidebarOpen = $state(false);
	let drawerEl = $state<HTMLDivElement | null>(null);
	let lastFocusedElement: HTMLElement | null = null;
	let previousBodyOverflow = '';

	function getFocusableElements(container: HTMLElement) {
		return Array.from(
			container.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)
		).filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true');
	}

	function toggleSidebar() {
		if (!sidebarOpen && typeof document !== 'undefined') {
			lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		}

		sidebarOpen = !sidebarOpen;
	}

	function closeSidebar() {
		sidebarOpen = false;
	}

	async function activateDrawer() {
		if (typeof document === 'undefined') return;

		previousBodyOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		await tick();

		if (!drawerEl) return;

		const [firstFocusable] = getFocusableElements(drawerEl);
		(firstFocusable ?? drawerEl).focus();
	}

	function deactivateDrawer() {
		if (typeof document === 'undefined') return;

		document.body.style.overflow = previousBodyOverflow;

		if (lastFocusedElement?.isConnected) {
			lastFocusedElement.focus();
		}
	}

	function trapDrawerFocus(event: KeyboardEvent) {
		if (!drawerEl) return;

		const focusableElements = getFocusableElements(drawerEl);
		if (focusableElements.length === 0) {
			event.preventDefault();
			drawerEl.focus();
			return;
		}

		const firstFocusable = focusableElements[0];
		const lastFocusable = focusableElements[focusableElements.length - 1];
		const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

		if (!activeElement || !drawerEl.contains(activeElement)) {
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

	function handleDrawerKeydown(event: KeyboardEvent) {
		if (!sidebarOpen) return;

		if (event.key === 'Escape') {
			event.preventDefault();
			closeSidebar();
		}

		if (event.key === 'Tab') {
			trapDrawerFocus(event);
		}
	}

	$effect(() => {
		if (!sidebarOpen) return;

		void activateDrawer();

		return () => {
			deactivateDrawer();
		};
	});
</script>

<svelte:window onkeydown={handleDrawerKeydown} />

<div class="flex min-h-screen bg-base-100">
	<div class="hidden lg:block">
		<Sidebar />
	</div>

	{#if sidebarOpen}
		<div class="fixed inset-0 z-40 lg:hidden">
			<button
				type="button"
				class="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onclick={closeSidebar}
				aria-label="Tutup menu navigasi"
			></button>
			<div
				bind:this={drawerEl}
				class="absolute left-0 top-0 h-full"
				role="dialog"
				aria-modal="true"
				aria-label="Mobile navigation"
				tabindex="-1"
			>
				<Sidebar onNavigate={closeSidebar} />
			</div>
		</div>
	{/if}

	<div class="flex-1 flex flex-col min-w-0">
		<TopBar {title} {theme} {toggleTheme} onMenuToggle={toggleSidebar} />
		
		<main class="flex-1 p-4 lg:p-8 overflow-y-auto">
			{@render children()}
		</main>
	</div>
</div>

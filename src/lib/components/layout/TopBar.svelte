<script lang="ts">
	import { tick } from 'svelte';

	interface Props {
		title?: string;
		section?: string;
		theme?: 'light' | 'dark';
		toggleTheme?: () => void;
		onMenuToggle?: () => void;
	}

	let { title = '', section = '', theme = 'light', toggleTheme, onMenuToggle }: Props = $props();
	let userMenuOpen = $state(false);
	let menuButtonEl = $state<HTMLButtonElement | null>(null);
	let menuPanelEl = $state<HTMLDivElement | null>(null);

	function getMenuLinks() {
		return menuPanelEl
			? Array.from(menuPanelEl.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
			: [];
	}

	async function openUserMenu() {
		userMenuOpen = true;
		await tick();
		getMenuLinks()[0]?.focus();
	}

	function closeUserMenu(restoreFocus = false) {
		userMenuOpen = false;

		if (restoreFocus) {
			menuButtonEl?.focus();
		}
	}

	function toggleUserMenu() {
		if (userMenuOpen) {
			closeUserMenu();
			return;
		}

		void openUserMenu();
	}

	function handleWindowClick(event: MouseEvent) {
		if (!userMenuOpen) return;

		const target = event.target;
		if (!(target instanceof Node)) return;

		if (menuButtonEl?.contains(target) || menuPanelEl?.contains(target)) {
			return;
		}

		closeUserMenu();
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (!userMenuOpen) return;

		if (event.key === 'Escape') {
			event.preventDefault();
			closeUserMenu(true);
		}
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<header class="topbar-shell sticky top-0 z-30 border-b" aria-label="Bilah navigasi atas">
	<div class="flex items-center justify-between px-4 lg:px-6 py-3">
		<div class="flex min-w-0 items-center gap-3 lg:gap-4">
			<button
				type="button"
				onclick={onMenuToggle}
				class="touch-target lg:hidden inline-flex items-center justify-center -ml-2 rounded-lg hover:bg-base-200 transition-colors"
				aria-label="Buka menu navigasi"
			>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
			</svg>
			</button>
			<div class="min-w-0">
				{#if section}
					<p class="hidden sm:block text-[0.68rem] font-medium uppercase tracking-[0.18em] text-subtle">
						{section}
					</p>
				{/if}
				<p class="truncate text-lg font-display font-semibold text-balance sm:text-xl">{title}</p>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={toggleTheme}
				class="touch-target inline-flex items-center justify-center rounded-lg hover:bg-base-200 transition-colors"
				aria-label={theme === 'dark' ? 'Aktifkan tema terang' : 'Aktifkan tema gelap'}
			>
				{#if theme === 'dark'}
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
				</svg>
				{/if}
			</button>

			<div class="relative">
				<button
					bind:this={menuButtonEl}
					type="button"
					class="touch-target flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-base-200 transition-colors"
					onclick={toggleUserMenu}
					aria-label="Buka menu akun administrator"
					aria-expanded={userMenuOpen}
					aria-controls="user-menu-panel"
				>
					<div class="brand-mark w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold">
						A
					</div>
					<span class="hidden sm:inline text-sm font-medium">Admin</span>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
				</svg>
				</button>
				{#if userMenuOpen}
				<div
					bind:this={menuPanelEl}
					id="user-menu-panel"
					class="floating-panel absolute right-0 z-50 mt-2 w-48 rounded-lg border border-base-300 bg-base-100 p-1"
				>
					<div class="px-3 py-2 text-xs text-subtle">
						Akses administrator demo aktif.
					</div>
					<div class="my-1 h-px bg-base-300"></div>
					<a href="/" class="touch-target flex items-center rounded-md px-3 py-2 text-sm hover:bg-base-200" onclick={() => closeUserMenu()}>
						Dashboard
					</a>
					<button
						type="button"
						class="touch-target flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-base-200"
						onclick={() => {
							toggleTheme?.();
							closeUserMenu(true);
						}}
					>
						Tema {theme === 'dark' ? 'terang' : 'gelap'}
					</button>
					<button
						type="button"
						class="touch-target flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-base-200"
						onclick={() => closeUserMenu(true)}
					>
						Tutup menu
					</button>
				</div>
			{/if}
			</div>
		</div>
	</div>
</header>

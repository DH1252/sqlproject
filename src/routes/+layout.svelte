<script lang="ts">
	import './layout.css';
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	type ThemeMode = 'light' | 'dark';

	let { children } = $props();

	let title = $derived(page.data?.title || 'Sistem Akademik');

	let theme = $state<ThemeMode>('light');

	function getStoredTheme(): ThemeMode | null {
		if (!browser) return null;

		try {
			const stored = localStorage.getItem('theme');
			return stored === 'dark' || stored === 'light' ? stored : null;
		} catch {
			return null;
		}
	}

	function resolveTheme(): ThemeMode {
		const storedTheme = getStoredTheme();
		if (storedTheme) return storedTheme;

		if (browser && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			return 'dark';
		}

		return 'light';
	}

	function applyTheme(nextTheme: ThemeMode, persist = true) {
		theme = nextTheme;

		if (!browser) return;

		document.documentElement.setAttribute('data-theme', nextTheme);
		document.documentElement.style.colorScheme = nextTheme;

		if (!persist) return;

		try {
			localStorage.setItem('theme', nextTheme);
		} catch {
			return;
		}
	}

	onMount(() => {
		const initialTheme = (document.documentElement.getAttribute('data-theme') as ThemeMode | null) ?? resolveTheme();
		applyTheme(initialTheme, false);
	});

	function toggleTheme() {
		applyTheme(theme === 'light' ? 'dark' : 'light');
	}
</script>

<svelte:head>
	<script>
		(() => {
			try {
				const stored = localStorage.getItem('theme');
				const theme = stored === 'dark' || stored === 'light'
					? stored
					: window.matchMedia('(prefers-color-scheme: dark)').matches
						? 'dark'
						: 'light';

				document.documentElement.setAttribute('data-theme', theme);
				document.documentElement.style.colorScheme = theme;
			} catch {
				document.documentElement.setAttribute('data-theme', 'light');
				document.documentElement.style.colorScheme = 'light';
			}
		})();
	</script>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet" />
</svelte:head>

<AppShell {title} {theme} {toggleTheme}>
	{@render children()}
</AppShell>

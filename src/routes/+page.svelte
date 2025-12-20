<script lang="ts">
	import { Button } from '$lib/components/ui/button';
    import {toggleMode} from "mode-watcher"
    import SunIcon from "@lucide/svelte/icons/sun"
    import MoonIcon from "@lucide/svelte/icons/moon"
</script>

<h1>Welcome to SvelteKit</h1>
<Button>Hello mom 💘</Button>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
<Button onclick={toggleMode} variant="outline" size="icon">
	<SunIcon
		class="transition-all! h-[1.2rem] w-[1.2rem] rotate-0 scale-100 dark:-rotate-90 dark:scale-0"
	/>
	<MoonIcon
		class="transition-all! absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 dark:rotate-0 dark:scale-100"
	/>
	<span class="sr-only">Toggle theme</span>
</Button>

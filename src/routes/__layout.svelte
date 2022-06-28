<script lang="ts">
	import Header from '$lib/header/Header.svelte';
	import '../app.css';
</script>

<main>
	<slot />
</main>
<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
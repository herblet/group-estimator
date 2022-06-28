<svelte:options immutable={true}/>
<script lang="ts">
  import SessionComponent from "$lib/SessionComponent.svelte";
  import WelcomeComponent from "$lib//Welcome.svelte";
  import { State } from "$lib//model/state";
  import type { Command } from "$lib//model/commands";
  import { Session, SessionType } from "$lib//model/session";
  import { StateManager } from "$lib/StateManager";
  import { StateExchanger, stompStateExchanger } from "$lib/StateExchanger";
  import { enablePatches } from 'immer';

  enablePatches();

  const stateManager = new StateManager(stompStateExchanger);
  let state = stateManager.state$;

  let name: string = "";
  
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	{#if !$state || !$state.session}
		<WelcomeComponent on:command={(event) => stateManager.updateState(event.detail)} />
	{:else}
		<SessionComponent on:command={(event) =>  stateManager.updateState(event.detail)} session={$state.session} sessionType={$state.sessionType} />
	{/if}
</section>
<style>
  section {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    section {
      max-width: none;
    }
  }
</style>


<svelte:options immutable={true} />

<script lang="ts">
  import type { Participant } from "./model/participant";
  export let participants: Participant [];
</script>

<div class="participants">
    <div class="header">Participants</div>
    <ul>
        {#each participants as participant}
        <li>{participant.name}</li>
        {/each}
    </ul>
</div>

<style lang="scss">
  .participants {

     ul {
        color: #000066;
        list-style: none;
        padding: 0;
     }
  }

  .header {
    font-size: 1.5em;
    font-weight: bold;
    color: #000066;
  } 
</style>

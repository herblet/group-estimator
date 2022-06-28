<svelte:options immutable={true} />

<script lang="ts">
  import type { Story } from "./model/story";
  export let stories: Story []
</script>

<div class="estimations">
    <div class="header">Estimations</div>
    <ul>
        {#each stories as story}
        <li>{story.title}</li>
        {/each}
    </ul>
</div>

<style lang="scss">
  .estimations {

     ul {
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

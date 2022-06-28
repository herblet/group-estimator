<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import EstimationsComponent from "./EstimationsComponent.svelte";
  import { Session, SessionType } from "./model/session";
  import { CommandType } from "./model/commands";
  import { Story } from "./model/story";
  import ParticipantsComponent from "./ParticipantsComponent.svelte";
  import { v4 } from "uuid";
  
  export let session: Session;
  export let sessionType: SessionType;

  const dispatch = createEventDispatcher();

  let newStoryTitle = "";
</script>

<main>
  <h1>{session.title}</h1>
  <div>Session Key: <input id="sessionKey" size="36" type="text" disabled={true} value="{session.key}"></div>
  <div class="row">

  <div class="col-3 participants">
    <ParticipantsComponent participants={session.participants} />
  </div>
  <div class="col-9 estimations">
    <EstimationsComponent stories={session.stories}   />
     {#if sessionType == SessionType.HOST}
      <button
        disabled={!newStoryTitle}
        on:click={() => {
          dispatch("command", {
            type: CommandType.ADD_STORY,
            data: new Story(v4(), newStoryTitle),
          });
          newStoryTitle = ''
        }}>Add Story</button><input bind:value={newStoryTitle} type="text" placeholder="Story Title" />
    {/if}
  </div>
 </div>
  
  <!-- <div>
	<input type="text" bind:value={title} placeholder="Session Title"><button disabled={!title} on:click={() => {
		session = new Session(title) 
		
		console.log("connecting...");
		socket = connect(session);
	}}>Start</button>
	</div>
	<div>
	<input type="text" bind:value={session} placeholder="Session Key">
	
	<button disabled={!session} on:click={() => {
		socket.send("hello");
	}}>Join</button>
	</div> -->
</main>

<style lang="scss">
  /* Import Base */
@import "@getbase/base/scss/_mixins";
@import "@getbase/base/scss/core";

/* Import Base Common */
@import "@getbase/base/scss/code";
@import "@getbase/base/scss/forms";
@import "@getbase/base/scss/tables";
@import "@getbase/base/scss/typography";
@import "@getbase/base/scss/headings";
@import "@getbase/base/scss/grid";

  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;

    .participants {
      position: absolute;
      left: 0px;
    }
  }

  #sessionKey {
    text-align: center;
    color: #003eaa;
    border: none;
  }

  .inline {
    display: inline-block;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>

<svelte:options immutable={true}/>
<script lang="ts">
    import { createEventDispatcher } from 'svelte'
	import { Commands, CommandType } from './model/commands'

	const dispatch = createEventDispatcher()

	let name = ''
    let title = ''
    let key = ''
</script>

<section>
	<div>
		<input type="text" bind:value={name} placeholder="Name">
	</div>
	<div>
	<input type="text" bind:value={title} placeholder="Session Title">
	<button disabled={!title} on:click={() => {
		dispatch('command', {
			type: CommandType.START,
			data: {
				title: title,
				name: name
			}
        })
	}}>Start</button>
	</div>
	<div>
	<input type="text" bind:value={key} placeholder="Session Key">
	
	<button disabled={!key} on:click={() => {
		dispatch('command', {
			type: CommandType.JOIN,
			data: {
            	key: key,
				name: name
			}
        })
	}}>Join</button>
	</div>
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
import App from './App.svelte';
import { enablePatches } from 'immer';
enablePatches();

window.process = {
  env: {
    NODE_ENV: "production",
  },
};

const app = new App({
	target: document.body
});

export default app;
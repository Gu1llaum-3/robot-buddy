import { mount } from 'svelte';
import App from './App.svelte';
import './showcase.css';

mount(App, { target: document.getElementById('app')! });

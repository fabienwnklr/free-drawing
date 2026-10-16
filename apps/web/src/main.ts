import { App } from './App';
import './style.css';

const $root = document.getElementById('app') as HTMLDivElement;
const hasMeta = (name: string) => !!document.querySelector(`meta[name="${name}"]`);

// accounts and live collaboration when served by the server of free-drawing (`yarn serve`, see apps/server),
// else drawings kept in browser (`yarn dev`, static site)
window.drawer = new App($root, {
  server: hasMeta('api-server'),
  collaboration: hasMeta('collaboration-server'),
}).drawer;

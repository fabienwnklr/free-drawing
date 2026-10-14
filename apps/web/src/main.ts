import { Drawer } from '@fabwcie/free-drawing';
import { App } from './App';
import './style.css';

const $root = document.getElementById('app') as HTMLDivElement;
const hasMeta = (name: string) => !!document.querySelector(`meta[name="${name}"]`);
// live collaboration when served by the server of free-drawing (`yarn serve`, see apps/server)
const collaboration = hasMeta('collaboration-server');

if (hasMeta('api-server')) {
  // accounts, drawings saved on server
  window.drawer = new App($root, collaboration).drawer;
} else {
  // demo without server (`yarn dev`, static site): drawing kept in browser
  $root.classList.add('demo');
  window.drawer = new Drawer($root, { collaboration });
}

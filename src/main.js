import './style.css'
import { Application } from 'pixi.js'

(async () => {
  const app = new Application();
  await app.init({ background: '#1099bb', resizeTo: window });
  document.querySelector('#app').appendChild(app.canvas);
})();

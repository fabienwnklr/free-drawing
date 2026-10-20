// Entry of the plugin package: what apps import
// import { StampsPlugin, StampCounterPlugin } from '@free-drawing/plugin-template';
// new Drawer($el, { plugins: [StampCounterPlugin], pluginOptions: { Stamps: { max: 20 } } });
import './style.css';

export { StampsPlugin, stampName } from './StampsPlugin';
export { StampCounterPlugin } from './StampCounterPlugin';
export { StampWidget } from './widgets/StampWidget';
export { ZoneWidget } from './widgets/ZoneWidget';
export { translations } from './translations';
export type { StampsOptions } from './types';

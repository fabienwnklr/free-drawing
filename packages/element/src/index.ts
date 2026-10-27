// web component of free-drawing: <free-drawing> defined in a browser (nothing on a server)
import { defineFreeDrawing } from './FreeDrawingElement.js';

export { FreeDrawingElement, defineFreeDrawing, type FreeDrawingElementEventMap } from './FreeDrawingElement.js';
export type { DrawerSettings } from './mountDrawer.js';

if (typeof customElements !== 'undefined') defineFreeDrawing();

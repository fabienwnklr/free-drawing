import type { Drawer } from "@/Drawer";
import { BaseOverlay } from "@/components/tools/Overlay/BaseOverlay"

/**
 * Overlay of selected shapes, sections shown by `SelectWidget` according to the selected shapes
 */
export class SelectOverlay extends BaseOverlay {
    constructor(drawer: Drawer) {
        super(drawer, { label: 'overlay.selection' });
    }
}

import type { Drawer } from "@/Drawer";
import { BaseOverlay } from "@/components/tools/Overlay/BaseOverlay"

/**
 * Overlay of selected shapes, sections shown by `SelectWidget` according to the selected shapes
 */
export class SelectOverlay extends BaseOverlay {
    /**
     * Create the selection panel, named as selection options
     * @param drawer Drawer whose selected shapes the fields change
     */
    constructor(drawer: Drawer) {
        super(drawer, { label: 'overlay.selection' });
    }
}

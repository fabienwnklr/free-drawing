import type { Drawer } from "@/Drawer";
import { BaseOverlay } from "@/components/tools/Overlay/BaseOverlay"

export class SelectOverlay extends BaseOverlay {
    constructor(drawer: Drawer) {
        super(drawer, { label: 'overlay.selection' });
    }
}

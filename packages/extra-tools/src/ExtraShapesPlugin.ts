import { PathShapeWidget, Plugin, pathShapeData, shapeName, type Drawer } from '@fabwcie/free-drawing';
import { blockArrowIcon, bubbleIcon, checkboxIcon, cloudIcon, heartIcon, hexagonIcon, starIcon } from './icons.js';
import { texts } from './texts.js';

/**
 * Heart tool: heart in the dragged box
 */
export class HeartWidget extends PathShapeWidget {
  protected shapeName = shapeName.heart;
  protected path = pathShapeData[shapeName.heart];

  /**
   * Create the heart tool, without shortcut
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'heart', 'Heart', heartIcon);
  }
}

/**
 * Cloud tool: cloud with a flat bottom in the dragged box
 */
export class CloudWidget extends PathShapeWidget {
  protected shapeName = shapeName.cloud;
  protected path = pathShapeData[shapeName.cloud];

  /**
   * Create the cloud tool, without shortcut
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'cloud', 'Cloud', cloudIcon);
  }
}

/**
 * Star tool: five branch star in the dragged box
 */
export class StarWidget extends PathShapeWidget {
  protected shapeName = shapeName.star;
  protected path = pathShapeData[shapeName.star];

  /**
   * Create the star tool, without shortcut
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'star', 'Star', starIcon);
  }
}

/**
 * Hexagon tool: hexagon with a flat top and bottom in the dragged box
 */
export class HexagonWidget extends PathShapeWidget {
  protected shapeName = shapeName.hexagon;
  protected path = pathShapeData[shapeName.hexagon];

  /**
   * Create the hexagon tool, without shortcut
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'hexagon', 'Hexagon', hexagonIcon);
  }
}

/**
 * Block arrow tool: wide arrow pointing right in the dragged box (rotated or flipped for other directions)
 */
export class BlockArrowWidget extends PathShapeWidget {
  protected shapeName = shapeName.blockArrow;
  protected path = pathShapeData[shapeName.blockArrow];

  /**
   * Create the block arrow tool, without shortcut
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'blockArrow', 'Block arrow', blockArrowIcon);
  }
}

/**
 * Speech bubble tool: rounded box with a tail in the dragged box
 */
export class BubbleWidget extends PathShapeWidget {
  protected shapeName = shapeName.bubble;
  protected path = pathShapeData[shapeName.bubble];

  /**
   * Create the speech bubble tool, without shortcut
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'bubble', 'Speech bubble', bubbleIcon);
  }
}

/**
 * Check box tool: rounded square with a check mark in the dragged box
 */
export class CheckboxWidget extends PathShapeWidget {
  protected shapeName = shapeName.checkbox;
  protected path = pathShapeData[shapeName.checkbox];

  /**
   * Create the check box tool, without shortcut
   * @param drawer Drawer of this widget
   */
  constructor(drawer: Drawer) {
    super(drawer, 'checkbox', 'Check box', checkboxIcon);
  }
}

/**
 * Extra shapes: heart, cloud, star, hexagon, block arrow, speech bubble and check box tools, drawn in the dragged box
 * as the triangle and the diamond of the library (background color, stroke style, texts in them, linked arrows). In
 * the "More tools" group of the toolbar by default (`widgetGroups` option)
 */
export class ExtraShapesPlugin extends Plugin {
  /** Unique name: `drawer.plugins.get('ExtraShapes')` */
  static readonly pluginName = 'ExtraShapes';
  /** Plugins required: none */
  static readonly requires = [];

  /**
   * Texts and tools of the shapes, before the toolbar is created
   * @param drawer Drawer of the plugin
   */
  constructor(drawer: Drawer) {
    super(drawer);
    this.addTranslations(texts);
    this.addWidget('heart', HeartWidget);
    this.addWidget('cloud', CloudWidget);
    this.addWidget('star', StarWidget);
    this.addWidget('hexagon', HexagonWidget);
    this.addWidget('blockArrow', BlockArrowWidget);
    this.addWidget('bubble', BubbleWidget);
    this.addWidget('checkbox', CheckboxWidget);
  }
}

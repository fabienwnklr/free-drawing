export enum Tools {
  pan = 'pan',
  selection = 'selection',
  brush = 'brush',
  eraser = 'eraser',
  text = 'text',
  rect = 'rect',
  circle = 'circle',
  ellipse = 'ellipse',
  square = 'square',
  arrow = 'arrow',
  line = 'line',
  star = 'star',
  triangle = 'triangle',
  polygon = 'polygon',
}

export type AvailableTools = keyof typeof Tools;

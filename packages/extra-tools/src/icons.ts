// Icons of the tools (svg markup of their buttons), as the icons of the library

/**
 * Icon of a stroke drawn in a box of 24 px
 * @param shapes Svg elements of the icon
 * @returns Svg markup, hidden to screen readers (the button is named)
 */
const icon = (shapes: string) =>
  '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  `stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${shapes}</svg>`;

/** Heart */
export const heartIcon = icon(
  '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"></path>'
);

/** Cloud */
export const cloudIcon = icon(
  '<path d="M6.66 18C4.08 18 2 15.99 2 13.52s2.08-4.49 4.66-4.49c.39-1.76 1.79-3.2 3.67-3.77 1.88-.57 3.96-.19 5.45 ' +
    '1 1.49 1.19 2.16 3.01 1.77 4.77h.99c1.91 0 3.46 1.56 3.46 3.49S20.45 18 18.54 18H6.66z"></path>'
);

/** Star */
export const starIcon = icon(
  '<path d="M12 4l2.01 6.19h6.49l-5.25 3.82 2 6.19L12 16.38 6.75 20.2l2-6.19-5.25-3.82h6.49z"></path>'
);

/** Hexagon */
export const hexagonIcon = icon('<path d="M7.5 4.5h9L21 12l-4.5 7.5h-9L3 12z"></path>');

/** Block arrow */
export const blockArrowIcon = icon('<path d="M3 9.5h9.5V5l8.5 7-8.5 7v-4.5H3z"></path>');

/** Speech bubble */
export const bubbleIcon = icon(
  '<path d="M6 4.5h12A2.5 2.5 0 0 1 20.5 7v7a2.5 2.5 0 0 1-2.5 2.5h-6.5L7 20l.5-3.5H6A2.5 2.5 0 0 1 3.5 14V7A2.5 ' +
    '2.5 0 0 1 6 4.5z"></path>'
);

/** Check box */
export const checkboxIcon = icon(
  '<rect x="4" y="4" width="16" height="16" rx="3"></rect><path d="M8.5 12.5l2.5 2.5 4.5-5.5"></path>'
);

/** Highlighter */
export const highlighterIcon = icon(
  '<path d="M3 19h4L17.5 8.5a2.83 2.83 0 1 0-4-4L3 15v4"></path><path d="M12.5 5.5l4 4M4.5 13.5l4 4M21 15v4h-8l4-4z"></path>'
);

/**
 * Icon of a width of highlighter: a line of this width
 * @param width Stroke width of the line in the icon
 * @returns Svg markup
 */
export const widthIcon = (width: number) =>
  '<svg aria-hidden="true" focusable="false" viewBox="0 0 20 20" fill="none" stroke="currentColor" ' +
  `stroke-linecap="round" stroke-linejoin="round"><path d="M5 10h10" stroke-width="${width}"></path></svg>`;

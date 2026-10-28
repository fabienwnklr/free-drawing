/**
 * Options of the stamps plugin. The app gives them with the class of the plugin in the `plugins` drawer option:
 * `new Drawer($el, { plugins: [[StampsPlugin, { max: 20 }]] })`
 */
export type StampsOptions = {
  /** Symbols of stamps: the first one for new stamps (a double click on a symbol edits it, as any text) */
  symbols: string[];
  /** Background colors of stamps: the first one for new stamps, a double click on the circle gives the next one */
  colors: string[];
  /** Diameter of stamps, in drawing units */
  size: number;
  /** Most stamps in a drawing: the plugin is disabled once reached (0: no limit) */
  max: number;
};

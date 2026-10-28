import type { Vector2d } from 'konva/lib/types';

/**
 * Event listener, called with the arguments given to `trigger` (`this`: the emitter)
 */
export type Listener = (...args: any) => any;

/**
 * Function returned by `throttle`: same parameters and result as the throttled function
 * @template T throttled function
 */
export type ThrottledFunction<T extends (...args: any) => any> = (...args: Parameters<T>) => ReturnType<T>;

/** Two fingers of a touch gesture when it started (or its fingers changed): what the view follows */
export type TouchGestureStart = {
  /** Distance between the fingers (px) */
  distance: number;
  /** Middle of the fingers, in the canvas (px) */
  center: Vector2d;
  /** Zoom of the view */
  scale: number;
  /** Position of the view (stage) */
  position: Vector2d;
};

/**
 * Names of the events of an emitter (`MicroEvent`)
 * @template Events events of the emitter with the arguments of their listeners
 */
export type EventName<Events> = keyof Events & string;

/**
 * Arguments given to the listeners of an event of an emitter
 * @template Events events of the emitter with the arguments of their listeners
 * @template K name of the event
 */
export type EventArgs<Events, K extends keyof Events> = Events[K] extends unknown[] ? Events[K] : never;

/**
 * Listener of an event of an emitter
 * @template Events events of the emitter with the arguments of their listeners
 * @template K name of the event
 */
export type EmitterListener<Events, K extends keyof Events> = (...args: EventArgs<Events, K>) => unknown;

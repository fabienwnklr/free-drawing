import { deprecatedEvents } from '@/constants';

/**
 * Event listener, called with the arguments given to `trigger` (`this`: the emitter)
 */
export type TCallback = (...args: any) => any;

const warned = new Set<string>();

/**
 * Current name of an event: names of previous versions are deprecated (warned once)
 */
function eventName(event: string): string {
  const name = deprecatedEvents[event];

  if (!name) return event;
  if (!warned.has(event)) {
    warned.add(event);
    console.warn(`free-drawing: "${event}" event is deprecated, use "${name}"`);
  }

  return name;
}

/**
 * Execute callback for each event in space separated list of event names
 *
 */
function forEvents(events: string, callback: (event: string) => any) {
  events.split(/\s+/).forEach((event) => {
    callback(eventName(event));
  });
}

/**
 * Event emitter base class (`Drawer`, `Dropdown`, `Toast`, `Settings`): `on` / `off` / `trigger` listeners by event
 * name, names of previous versions mapped to current ones with a warning
 */
export default class MicroEvent {
  /** Listeners by event name, in order of registration */
  public _events: { [key: string]: TCallback[] } = {};

  constructor() {
    this._events = {};
  }

  /**
   * Listen to events
   * @param events event name, or several separated by spaces
   * @param fct listener, called on each trigger
   */
  on(events: string, fct: TCallback) {
    forEvents(events, (event) => {
      const event_array = this._events[event] || [];
      event_array.push(fct);
      this._events[event] = event_array;
    });
  }

  /**
   * Remove a listener of events: without listener all listeners of these events, without arguments all listeners
   * @param events event name, or several separated by spaces
   * @param fct listener given to `on`
   */
  off(events: string, fct: TCallback) {
    const n = arguments.length;
    if (n === 0) {
      this._events = {};
      return;
    }

    forEvents(events, (event) => {
      if (n === 1) {
        delete this._events[event];
        return;
      }

      const event_array = this._events[event];
      if (event_array === undefined) return;

      const index = event_array.indexOf(fct);
      // indexOf returns -1 for unknown handler, splice(-1) would remove the last one
      if (index !== -1) event_array.splice(index, 1);
      this._events[event] = event_array;
    });
  }

  /**
   * Call listeners of events, in order of registration
   * @param events event name, or several separated by spaces
   * @param args arguments given to listeners
   */
  trigger(events: string, ...args: any) {
    forEvents(events, (event) => {
      const event_array = this._events[event];
      if (event_array === undefined) return;
      event_array.forEach((fct) => {
        fct.apply(this, args);
      });
    });
  }
}

import { deprecatedEvents } from '@/constants';
import type { EmitterListener, EventArgs, EventName, Listener } from '@/@types/utils';

/** Deprecated event names already warned about */
const warned = new Set<string>();

/**
 * Current name of an event: names of previous versions are deprecated (warned once)
 * @param event event name, current or of a previous version
 * @returns current name of the event (the name itself when not deprecated)
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
 * @param events event names separated by white space
 * @param callback called with the current name of each event
 */
function forEvents(events: string, callback: (event: string) => any) {
  events.split(/\s+/).forEach((event) => {
    callback(eventName(event));
  });
}

/**
 * Event emitter base class (`Drawer`, `Dropdown`, `Toast`): `on` / `off` / `trigger` listeners by event name, names of
 * previous versions mapped to current ones with a warning. Names and arguments of listeners typed by the events of the
 * emitter (an unknown name is an error in TypeScript)
 * @template Events events of the emitter with the arguments of their listeners (`DrawerEventMap` for the drawer)
 */
export default class MicroEvent<Events extends object = Record<string, any[]>> {
  /** Listeners by event name, in order of registration */
  public _events: Record<string, Listener[]> = {};

  /** Creates an emitter without listeners */
  constructor() {
    this._events = {};
  }

  /**
   * Listen to an event
   * @template K name of the event
   * @param events event name (several separated by spaces in JavaScript)
   * @param fct listener, called on each trigger with the arguments of the event
   */
  on<K extends EventName<Events>>(events: K, fct: EmitterListener<Events, K>) {
    forEvents(events, (event) => {
      const event_array = this._events[event] || [];
      event_array.push(fct as Listener);
      this._events[event] = event_array;
    });
  }

  /**
   * Remove a listener of an event: without listener all listeners of this event, without arguments all listeners
   * @template K name of the event
   * @param events event name (several separated by spaces in JavaScript)
   * @param fct listener given to `on`
   */
  off<K extends EventName<Events>>(events?: K, fct?: EmitterListener<Events, K>) {
    if (events === undefined) {
      this._events = {};
      return;
    }

    forEvents(events, (event) => {
      if (fct === undefined) {
        delete this._events[event];
        return;
      }

      const event_array = this._events[event];
      if (event_array === undefined) return;

      const index = event_array.indexOf(fct as Listener);
      // indexOf returns -1 for unknown handler, splice(-1) would remove the last one
      if (index !== -1) event_array.splice(index, 1);
      this._events[event] = event_array;
    });
  }

  /**
   * Call listeners of an event, in order of registration. A listener may add or remove listeners: the ones added are
   * called from the next trigger, the ones removed (not called yet) are not called, the others are all called.
   * @template K name of the event
   * @param events event name (several separated by spaces in JavaScript)
   * @param args arguments given to listeners, as typed by the event
   */
  trigger<K extends EventName<Events>>(events: K, ...args: EventArgs<Events, K>) {
    forEvents(events, (event) => {
      const event_array = this._events[event];
      if (event_array === undefined) return;

      // copy: the list may change during the loop (a removed listener would make the next one skipped)
      for (const fct of [...event_array]) {
        if (this._events[event]?.includes(fct)) fct.apply(this, args);
      }
    });
  }
}

/**
 * Event listener, called with the arguments given to `trigger` (`this`: the emitter)
 */
export type Listener = (...args: any) => any;

/**
 * Function returned by `throttle`: same parameters and result as the throttled function
 * @template T throttled function
 */
export type ThrottledFunction<T extends (...args: any) => any> = (...args: Parameters<T>) => ReturnType<T>;

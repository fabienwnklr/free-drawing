/**
 * Types of toast messages: class of toast (color) and its icon
 */
export enum Types {
  /** Default message, no icon */
  neutral = 'neutral',
  /** Information, info icon */
  info = 'info',
  /** Warning, warning icon, announced at once by screen readers */
  warning = 'warning',
  /** Problem, same as `error` */
  danger = 'danger',
  /** Error, error icon, announced at once by screen readers */
  error = 'error',
}

/**
 * Type of a toast message (`drawer.toast(message, type)`), name of a `Types` member
 */
export type AvailableTypes = keyof typeof Types;

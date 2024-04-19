export enum Types {
  neutral = 'neutral',
  info = 'info',
  warning = 'warning',
  danger = 'danger',
  error = 'error',
}

export type AvailableTypes = keyof typeof Types;

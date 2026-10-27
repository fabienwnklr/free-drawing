// client component (React Server Components): effects and state
'use client';

import {
  createElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from 'react';
import type { Drawer, DrawerOptions } from '@fabwcie/free-drawing';
import { applySettings, mountDrawer, withSettings, type DrawerSettings } from './mountDrawer.js';

/** Properties of `FreeDrawing`: options and settings of the drawer, its events, attributes of its element */
export interface FreeDrawingProps extends DrawerSettings, Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Options of the drawer, read when it is created: give another `key` to create it again with other options */
  options?: Partial<DrawerOptions>;
  /** Drawer ready: plugins initialized, drawing of the `storage` option loaded (`drawer.ready`) */
  onReady?: (drawer: Drawer) => void;
  /** Drawing changed: shapes, background... (`drawer.change` event) */
  onChange?: (drawer: Drawer) => void;
}

/**
 * Drawing board of free-drawing in a `div`: the drawer is created once mounted (library loaded then, never on a
 * server) and destroyed once unmounted. Without `width` and `height` options, it takes the size of its element and
 * follows it. The ref gives the drawer, null until it is created.
 */
export const FreeDrawing = forwardRef<Drawer | null, FreeDrawingProps>(function FreeDrawing(
  { options, readOnly, theme, language, user, onReady, onChange, ...attributes },
  ref
) {
  const host = useRef<HTMLDivElement>(null);
  const [drawer, setDrawer] = useState<Drawer | null>(null);
  // props of the last render, read when the drawer is created and by its events
  const props = useRef({ options, readOnly, theme, language, user, onReady, onChange });
  // an equal user of another render is not given again
  const userKey = user === undefined ? undefined : JSON.stringify(user);

  // before the effect creating the drawer
  useEffect(() => {
    props.current = { options, readOnly, theme, language, user, onReady, onChange };
  });

  useEffect(() => {
    const unmount = mountDrawer(
      host.current!,
      () => {
        const { options, readOnly, theme, language, user } = props.current;
        return withSettings(options, { readOnly, theme, language, user });
      },
      {
        created: setDrawer,
        ready: (created) => props.current.onReady?.(created),
        change: (changed) => props.current.onChange?.(changed),
      }
    );

    return () => {
      unmount();
      setDrawer(null);
    };
  }, []);

  useEffect(() => {
    if (drawer) applySettings(drawer, { readOnly, theme, language });
  }, [drawer, readOnly, theme, language]);

  useEffect(() => {
    // given as option when the drawer was created, again for a new user (read from its key)
    if (drawer && userKey !== undefined) drawer.setUser(JSON.parse(userKey));
  }, [drawer, userKey]);

  useImperativeHandle<Drawer | null, Drawer | null>(ref, () => drawer, [drawer]);

  // the drawer does not give its size to the element (contain) nor to its grid or flex box (overflow): they can shrink
  const style: CSSProperties = { overflow: 'hidden', contain: 'inline-size', ...attributes.style };

  return createElement('div', { ...attributes, style, ref: host });
});

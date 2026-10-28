import { defineComponent, h, onBeforeUnmount, onMounted, ref, shallowRef, watch, type PropType } from 'vue';
import type { Drawer, DrawerOptions, DrawerUser, Language, Theme } from '@fabwcie/free-drawing';
import { applySettings, mountDrawer, withSettings } from './mountDrawer.js';

/**
 * Drawing board of free-drawing in a `div`: the drawer is created once mounted (library loaded then, never on a
 * server) and destroyed once unmounted. Without `width` and `height` options, it takes the size of its element and
 * follows it. A template ref gives the drawer (`drawer`), null until it is created.
 */
export const FreeDrawing = defineComponent({
  name: 'FreeDrawing',
  props: {
    /** Options of the drawer, read when it is created: give another `key` to create it again with other options */
    options: { type: Object as PropType<Partial<DrawerOptions>>, default: undefined },
    /** Drawing can't be modified by the user (`drawer.setReadOnly`) */
    readOnly: { type: Boolean, default: undefined },
    /** Theme: 'light', 'dark' or 'system' (`drawer.setTheme`): wins over the theme saved in the browser */
    theme: { type: String as PropType<Theme>, default: undefined },
    /** Language of the interface, 'auto' for the one of the browser (`drawer.setLanguage`): wins over the saved one */
    language: { type: String as PropType<Language | 'auto'>, default: undefined },
    /** User of the app: id and name in collaboration sessions (`drawer.setUser`), null for an anonymous user */
    user: { type: Object as PropType<DrawerUser | null>, default: undefined },
  },
  emits: {
    /** Drawer ready: plugins initialized, drawing of the `storage` option loaded (`drawer.ready`) */
    ready: (drawer: Drawer) => !!drawer,
    /** Drawing changed: shapes, background... (`change` event) */
    change: (drawer: Drawer) => !!drawer,
  },
  setup(props, { emit, expose }) {
    /** Element of the component */
    const host = ref<HTMLDivElement>();
    /** Drawer, null until it is created */
    const drawer = shallowRef<Drawer | null>(null);
    let unmount: (() => void) | undefined;

    expose({ drawer });

    onMounted(() => {
      unmount = mountDrawer(
        host.value!,
        () => {
          const { options, readOnly, theme, language, user } = props;
          return withSettings(options, { readOnly, theme, language, user });
        },
        {
          created: (created) => {
            drawer.value = created;
          },
          ready: (created) => emit('ready', created),
          change: (changed) => emit('change', changed),
        }
      );
    });

    onBeforeUnmount(() => {
      unmount?.();
      drawer.value = null;
    });

    watch([drawer, () => props.readOnly, () => props.theme, () => props.language], () => {
      if (drawer.value) applySettings(drawer.value, props);
    });

    // given as option when the drawer was created, again for a new user (an equal one is not given again)
    watch(
      () => (props.user === undefined ? undefined : JSON.stringify(props.user)),
      () => {
        if (drawer.value && props.user !== undefined) drawer.value.setUser(props.user);
      }
    );

    return { host, drawer };
  },
  render() {
    // the drawer does not give its size to the element (contain) nor to its grid or flex box (overflow): they can
    // shrink (style of the app merged after it)
    return h('div', { ref: 'host', style: { overflow: 'hidden', contain: 'inline-size' } });
  },
});

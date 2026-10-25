import '@/components/CommandPalette/command-palette.scss';
import type { Drawer } from '@/Drawer';
import { Group } from 'konva/lib/Group';
import { Modal } from '@/components/Modal/Modal';
import type { SelectWidget } from '@/components/toolbar/widgets/Select/Select';
import type { TranslationKey, Language } from '@/@types/i18n';
import { languages } from '@/i18n/I18n';
import { isComposing, uniqueId } from '@/utils/dom';
import SearchIcon from '@/icons/search.svg?raw';
import CheckIcon from '@/icons/check.svg?raw';
import UndoIcon from '@/icons/undo.svg?raw';
import RedoIcon from '@/icons/redo.svg?raw';
import SelectIcon from '@/icons/select.svg?raw';
import DuplicateIcon from '@/icons/duplicate.svg?raw';
import GroupIcon from '@/icons/group.svg?raw';
import UngroupIcon from '@/icons/ungroup.svg?raw';
import TrashIcon from '@/icons/trash.svg?raw';
import GridIcon from '@/icons/grid.svg?raw';
import ZenIcon from '@/icons/zen.svg?raw';
import MoonIcon from '@/icons/moon.svg?raw';
import LayersIcon from '@/icons/layers.svg?raw';
import PlusIcon from '@/icons/plus.svg?raw';
import MinusIcon from '@/icons/minus.svg?raw';
import ZoomResetIcon from '@/icons/zoom-reset.svg?raw';
import ZoomFitIcon from '@/icons/zoom-fit.svg?raw';
import ZoomSelectionIcon from '@/icons/zoom-selection.svg?raw';
import RecenterIcon from '@/icons/recenter.svg?raw';
import HelpIcon from '@/icons/help.svg?raw';
import OpenIcon from '@/icons/open.svg?raw';
import SaveIcon from '@/icons/save.svg?raw';
import SaveNowIcon from '@/icons/save-now.svg?raw';
import PinIcon from '@/icons/pin.svg?raw';
import LinkIcon from '@/icons/link.svg?raw';
import ExportIcon from '@/icons/export.svg?raw';
import UsersIcon from '@/icons/users.svg?raw';
import EyeIcon from '@/icons/eye.svg?raw';
import StoreIcon from '@/icons/store.svg?raw';
import LanguageIcon from '@/icons/language.svg?raw';
import SlidersIcon from '@/icons/sliders.svg?raw';
import LockIcon from '@/icons/lock.svg?raw';
import { isFrame } from '@/utils/frame';
import { getTexts } from '@/utils/text';
import UnlockIcon from '@/icons/unlock.svg?raw';
import FlipHorizontalIcon from '@/icons/flip-horizontal.svg?raw';
import RotateRightIcon from '@/icons/rotate-right.svg?raw';
import RotateLeftIcon from '@/icons/rotate-left.svg?raw';
import FlipVerticalIcon from '@/icons/flip-vertical.svg?raw';
import FitWidthIcon from '@/icons/fit-width.svg?raw';
import type { Command, CommandGroup } from '@/@types/ui';
import { shapeAlignments, shapeDistributions, shapeOrders, shapeStacks } from '@/constants';
import { formatShortcut } from '@/utils/shortcut';

/** Accents of decomposed letters (U+0300 to U+036F) */
const accents = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g');

/**
 * Text compared with search: lower case, without accents
 * @param text Search or text of a command (label, group, id)
 * @returns Text decomposed (NFD), without accents, in lower case
 */
const normalize = (text: string) => text.normalize('NFD').replace(accents, '').toLowerCase();

/**
 * Command palette: search field and commands available now (tools, edition, view, file, language),
 * arrow keys choose one, Enter or click runs it
 */
export class CommandPalette extends Modal {
  /** Search field (`combobox`): keeps focus, arrow keys choose an option, Enter runs it */
  $input: HTMLInputElement;
  /** List of options (`listbox`) of commands matching search, in their groups */
  $list: HTMLDivElement;
  /** Message shown when no command matches search */
  $empty: HTMLParagraphElement;
  /** Commands available when palette was opened */
  commands: Command[] = [];
  /** Commands matching search, in list order */
  #shown: Command[] = [];
  /** Index of the active option in shown commands */
  #active = 0;

  /**
   * Build the palette without header nor footer: search field, list of commands and empty message
   * @param drawer Drawer whose commands are listed and run
   */
  constructor(drawer: Drawer) {
    super(drawer, { showHeader: false });
    this.$modal.classList.add('drawer-modal-commands');
    this.$modalFooter.remove();

    const $search = document.createElement('div');

    $search.classList.add('drawer-commands-search');
    $search.innerHTML = SearchIcon;

    // combobox: focus stays in field, active option given by aria-activedescendant
    this.$input = document.createElement('input');
    this.$input.type = 'text';
    this.$input.classList.add('drawer-commands-input');
    this.$input.autocomplete = 'off';
    this.$input.spellcheck = false;
    this.$input.setAttribute('role', 'combobox');
    this.$input.setAttribute('aria-expanded', 'true');
    this.$input.setAttribute('aria-autocomplete', 'list');
    $search.append(this.$input);

    this.$list = document.createElement('div');
    this.$list.id = uniqueId('commands');
    this.$list.classList.add('drawer-commands-list');
    this.$list.setAttribute('role', 'listbox');
    this.$input.setAttribute('aria-controls', this.$list.id);

    this.$empty = document.createElement('p');
    this.$empty.classList.add('drawer-commands-empty', 'text-muted');
    this.$empty.hidden = true;

    this.$modalBody.append($search, this.$list, this.$empty);

    drawer.i18n.translate((t) => {
      this.$modal.setAttribute('aria-label', t('menu.commands'));
      this.$list.setAttribute('aria-label', t('menu.commands'));
      this.$input.placeholder = t('commands.search');
      this.$input.setAttribute('aria-label', t('commands.search'));
      this.$empty.textContent = t('commands.empty');
    });

    this.$input.addEventListener('input', () => this._filter());
    this.$input.addEventListener('keydown', (e) => this._onKeydown(e));
  }

  /**
   * Show palette with commands available now, search field empty
   */
  show() {
    this.commands = this._getCommands();
    this.$input.value = '';
    this._filter();
    super.show();
  }

  /**
   * Close palette (focus back in drawer), then run command
   * @param command Command chosen (Enter or click)
   */
  execute(command: Command) {
    this.hide();
    command.run();
  }

  /**
   * Commands matching every word of search, in label, group or id
   */
  private _filter() {
    const words = normalize(this.$input.value).split(/\s+/).filter(Boolean);

    this.#shown = this.commands.filter((command) => {
      const text = normalize(`${command.label} ${this.drawer.t(command.group)} ${command.id}`);

      return words.every((word) => text.includes(word));
    });
    this._render();
  }

  /**
   * Options of shown commands, in their groups, first one active
   */
  private _render() {
    const groups = new Map<TranslationKey, Command[]>();

    for (const command of this.#shown) {
      groups.set(command.group, [...(groups.get(command.group) ?? []), command]);
    }
    this.#shown = [...groups.values()].flat();
    this.$list.replaceChildren(
      ...[...groups].map(([group, commands]) => {
        const $group = document.createElement('div');
        const $title = document.createElement('div');

        $title.id = uniqueId('commands-group');
        $title.classList.add('drawer-commands-group');
        $title.setAttribute('role', 'presentation');
        $title.textContent = this.drawer.t(group);
        $group.setAttribute('role', 'group');
        $group.setAttribute('aria-labelledby', $title.id);
        $group.append($title, ...commands.map((command) => this._createOption(command)));

        return $group;
      })
    );
    this.$list.hidden = !this.#shown.length;
    this.$empty.hidden = !this.$list.hidden;
    this.$list.scrollTop = 0;
    this._setActive(0);
  }

  /**
   * Option of a command: icon, label, check mark when checked, shortcut. Hover makes it active, click runs it
   * @param command Command shown by the option
   * @returns Option element (`role="option"`), added to its group by `_render`
   */
  private _createOption(command: Command) {
    const $option = document.createElement('div');
    const $label = document.createElement('span');

    $option.id = uniqueId('command');
    $option.classList.add('drawer-commands-option');
    $option.setAttribute('role', 'option');
    $option.setAttribute('aria-selected', 'false');
    if (command.checked !== undefined) $option.setAttribute('aria-checked', String(command.checked));
    $option.innerHTML = `<span class="drawer-commands-icon" aria-hidden="true">${command.icon ?? ''}</span>`;
    $label.classList.add('drawer-commands-label');
    $label.textContent = command.label;
    $option.append($label);
    if (command.checked) {
      $option.insertAdjacentHTML(
        'beforeend',
        `<span class="drawer-commands-check" aria-hidden="true">${CheckIcon}</span>`
      );
    }
    if (command.shortcut) {
      const $shortcut = document.createElement('kbd');

      $shortcut.classList.add('drawer-commands-shortcut');
      $shortcut.textContent = formatShortcut(command.shortcut, this.drawer.i18n.t);
      $option.append($shortcut);
    }

    // focus stays in search field
    $option.addEventListener('mousedown', (e) => e.preventDefault());
    // not on scroll under a still pointer
    $option.addEventListener('mousemove', () => this._setActive(this.#shown.indexOf(command)));
    $option.addEventListener('click', () => this.execute(command));

    return $option;
  }

  /**
   * Active option (`aria-selected`, `aria-activedescendant` of the field), scrolled into view
   * @param index Index in shown commands, none active when out of them
   */
  private _setActive(index: number) {
    const $options = [...this.$list.querySelectorAll<HTMLElement>('[role="option"]')];
    const $active = $options[index];

    this.#active = index;
    for (const $option of $options) $option.setAttribute('aria-selected', String($option === $active));
    if ($active) {
      this.$input.setAttribute('aria-activedescendant', $active.id);
      $active.scrollIntoView?.({ block: 'nearest' });
    } else {
      this.$input.removeAttribute('aria-activedescendant');
    }
  }

  /**
   * Keys of the search field: Down / Up move the active option (looping), Enter runs it
   * @param e Keydown of the search field (ignored during composition)
   */
  private _onKeydown(e: KeyboardEvent) {
    const count = this.#shown.length;

    if (isComposing(e)) return;
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && count) {
      e.preventDefault();
      // last to first and back
      this._setActive((this.#active + (e.key === 'ArrowDown' ? 1 : -1) + count) % count);
    } else if (e.key === 'Enter' && this.#shown[this.#active]) {
      e.preventDefault();
      this.execute(this.#shown[this.#active]);
    }
  }

  /**
   * Commands available now: widgets of toolbar, actions allowed (read only, selection, history),
   * components shown (zoom, position, layers), states of toggles
   * @returns Available commands with the title of their group, in order of groups (tools, editor, view, file, language)
   */
  private _getCommands(): Command[] {
    const { drawer } = this;
    const t = drawer.t.bind(drawer);
    const edit = !drawer.readOnly;
    const selectWidget = drawer.getWidget<SelectWidget>('selection');
    // locked shapes are selected to be unlocked, not modified
    const locked = edit && !!selectWidget?.isLocked();
    const selected = selectWidget && !locked ? drawer.getSelectedShapes() : [];
    const editSelection = edit && selected.length > 0;
    const hasShapes = drawer.getDrawingShapes().length > 0;
    const { collaboration } = drawer;
    const { zoom, position, layersPanel } = drawer;
    const groups: CommandGroup[] = [
      [
        'help.tools',
        [
          ...[...drawer.toolbar.widgets.values()]
            .filter((widget) => !widget.isDisabled)
            .map((widget) => ({
              id: `tool ${widget.id}`,
              label: widget.$button.title,
              icon: widget.$button.querySelector('svg')?.outerHTML,
              shortcut: widget.shortcut?.toUpperCase(),
              checked: drawer.activeTool === widget.id,
              run: () => widget.setActive(true),
            })),
          !!drawer.toolbar.$keepToolButton && {
            id: 'keep tool lock pin',
            label: t('toolbar.keepTool'),
            icon: PinIcon,
            shortcut: 'Q',
            checked: drawer.options.keepTool,
            run: () => drawer.setKeepTool(!drawer.options.keepTool),
          },
        ],
      ],
      [
        'help.editor',
        [
          edit &&
            drawer.undoRedo.canUndo() && {
              id: 'undo history',
              label: t('history.undo'),
              icon: UndoIcon,
              shortcut: 'Ctrl+Z',
              run: () => drawer.undoRedo.undo(),
            },
          edit &&
            drawer.undoRedo.canRedo() && {
              id: 'redo history',
              label: t('history.redo'),
              icon: RedoIcon,
              shortcut: 'Ctrl+Y',
              run: () => drawer.undoRedo.redo(),
            },
          edit &&
            selectWidget &&
            drawer.getDrawingShapes().length > 0 && {
              id: 'select all',
              label: t('help.selectAll'),
              icon: SelectIcon,
              shortcut: 'Ctrl+A',
              run: () => selectWidget.selectAll(),
            },
          editSelection && {
            id: 'duplicate copy',
            label: t('action.duplicate'),
            icon: DuplicateIcon,
            shortcut: 'Ctrl+D',
            run: () => drawer.duplicateShapes(),
          },
          editSelection &&
            drawer.linkEditor && {
              id: 'link url address web page',
              label: t('action.link'),
              icon: LinkIcon,
              run: () => drawer.linkEditor?.edit(),
            },
          edit &&
            drawer.canGroupShapes(selected) && {
              id: 'group',
              label: t('action.group'),
              icon: GroupIcon,
              shortcut: 'Ctrl+G',
              run: () => drawer.groupShapes(),
            },
          edit &&
            selected.some((shape) => shape instanceof Group && !isFrame(shape)) && {
              id: 'ungroup',
              label: t('action.ungroup'),
              icon: UngroupIcon,
              shortcut: 'Ctrl+Shift+G',
              run: () => drawer.ungroupShapes(),
            },
          // top first
          ...[...shapeOrders].reverse().map(
            ({ value: order, label, icon, shortcut }) =>
              editSelection && {
                id: `order layer ${order}`,
                label: t(label),
                icon,
                shortcut,
                run: () => drawer.reorderShapes(order),
              }
          ),
          // 2 shapes at least (distribute: 3)
          ...shapeAlignments.map(
            ({ value, label, icon }) =>
              editSelection &&
              selected.length > 1 && {
                id: `align shapes ${value}`,
                label: t(label),
                icon,
                run: () => drawer.alignShapes(value),
              }
          ),
          ...shapeDistributions.map(
            ({ value, label, icon }) =>
              editSelection &&
              selected.length > 2 && {
                id: `distribute shapes spacing ${value}`,
                label: t(label),
                icon,
                run: () => drawer.distributeShapes(value),
              }
          ),
          ...shapeStacks.map(
            ({ value, label, icon }) =>
              editSelection &&
              selected.length > 1 && {
                id: `stack shapes ${value}`,
                label: t(label),
                icon,
                run: () => drawer.stackShapes(value),
              }
          ),
          editSelection && {
            id: 'rotate turn right clockwise 90',
            label: t('action.rotateRight'),
            icon: RotateRightIcon,
            shortcut: 'Shift+R',
            run: () => drawer.rotateShapes(90),
          },
          editSelection && {
            id: 'rotate turn left counterclockwise 90',
            label: t('action.rotateLeft'),
            icon: RotateLeftIcon,
            shortcut: 'Shift+L',
            run: () => drawer.rotateShapes(-90),
          },
          editSelection && {
            id: 'flip mirror horizontal',
            label: t('action.flipHorizontal'),
            icon: FlipHorizontalIcon,
            shortcut: 'Shift+H',
            run: () => drawer.flipShapes('horizontal'),
          },
          editSelection && {
            id: 'flip mirror vertical',
            label: t('action.flipVertical'),
            icon: FlipVerticalIcon,
            shortcut: 'Shift+V',
            run: () => drawer.flipShapes('vertical'),
          },
          editSelection &&
            getTexts(selected).length > 0 && {
              id: 'fit text width content shrink',
              label: t('action.fitTextWidth'),
              icon: FitWidthIcon,
              shortcut: 'Shift+W',
              run: () => drawer.fitTextWidth(),
            },
          editSelection && {
            id: 'lock',
            label: t('context.lock'),
            icon: LockIcon,
            shortcut: 'Ctrl+Shift+L',
            run: () => drawer.setShapesLocked(true),
          },
          locked && {
            id: 'unlock',
            label: t('context.unlock'),
            icon: UnlockIcon,
            shortcut: 'Ctrl+Shift+L',
            run: () => drawer.setShapesLocked(false),
          },
          editSelection && {
            id: 'delete remove',
            label: t('action.delete'),
            icon: TrashIcon,
            shortcut: 'Delete',
            run: () => drawer.deleteShapes(),
          },
          {
            id: 'auto save autosave',
            label: t('preferences.autoSave'),
            icon: SaveNowIcon,
            checked: drawer.options.autoSave,
            run: () => drawer.setAutoSave(!drawer.options.autoSave),
          },
          !drawer.options.autoSave && {
            id: 'save now store',
            label: t('menu.save'),
            icon: SaveNowIcon,
            shortcut: 'Ctrl+S',
            run: () => drawer.saveNow(),
          },
          edit && {
            id: 'clear canvas',
            label: t('menu.clearCanvas'),
            icon: TrashIcon,
            shortcut: 'Ctrl+Delete',
            run: () => drawer.clearCanvas(),
          },
        ],
      ],
      [
        'help.view',
        [
          {
            id: 'grid',
            label: t('menu.showGrid'),
            icon: GridIcon,
            shortcut: 'Alt+G',
            checked: drawer.grid,
            run: () => drawer.setting.toggleGrid(),
          },
          selectWidget && {
            id: 'snap objects',
            label: t('context.snap'),
            shortcut: 'Alt+S',
            checked: selectWidget.snapping,
            run: () => drawer.setting.toggleSnapping(),
          },
          {
            id: 'zen mode',
            label: t('menu.zenMode'),
            icon: ZenIcon,
            shortcut: 'Alt+Z',
            checked: drawer.setting.zenMode,
            run: () => drawer.setting.toggleZenMode(),
          },
          {
            id: 'dark mode theme',
            label: t('menu.darkMode'),
            icon: MoonIcon,
            shortcut: 'Alt+Shift+D',
            checked: drawer.isDarkMode(),
            run: () => drawer.toggleDarkMode(),
          },
          layersPanel && {
            id: 'layers panel',
            label: t('help.layers'),
            icon: LayersIcon,
            shortcut: 'Alt+L',
            checked: layersPanel.isVisible(),
            run: () => layersPanel.toggle(),
          },
          zoom && { id: 'zoom in', label: t('zoom.in'), icon: PlusIcon, run: () => zoom.zoomPlus() },
          zoom && { id: 'zoom out', label: t('zoom.out'), icon: MinusIcon, run: () => zoom.zoomMinus() },
          zoom && {
            id: 'zoom reset 100',
            label: zoom.$btnReset.title,
            icon: ZoomResetIcon,
            shortcut: 'Shift+0',
            run: () => zoom.resetZoom(),
          },
          drawer.options.zoom &&
            hasShapes && {
              id: 'zoom fit whole drawing all',
              label: t('zoom.fit'),
              icon: ZoomFitIcon,
              shortcut: 'Shift+1',
              run: () => drawer.zoomToFit(),
            },
          // view only: also a locked selection
          drawer.options.zoom &&
            drawer.getSelectedShapes().length > 0 && {
              id: 'zoom selection',
              label: t('zoom.selection'),
              icon: ZoomSelectionIcon,
              shortcut: 'Shift+2',
              run: () => drawer.zoomToSelection(),
            },
          position && {
            id: 'position origin recenter',
            label: t('position.recenter'),
            icon: RecenterIcon,
            run: () => position.recenter(),
          },
          {
            id: 'preferences settings',
            label: t('preferences.title'),
            icon: SlidersIcon,
            shortcut: 'Ctrl+,',
            run: () => drawer.showPreferences(),
          },
          { id: 'help shortcuts', label: t('help.title'), icon: HelpIcon, run: () => drawer.help.show() },
        ],
      ],
      [
        'commands.file',
        [
          edit && {
            id: 'open file',
            label: t('menu.open'),
            icon: OpenIcon,
            shortcut: 'Ctrl+O',
            run: () => drawer.open(),
          },
          {
            id: 'save file download',
            label: t('menu.saveAs'),
            icon: SaveIcon,
            shortcut: 'Ctrl+Shift+S',
            run: () => drawer.saveAs(),
          },
          { id: 'copy link share', label: t('menu.copyLink'), icon: LinkIcon, run: () => drawer.copyLink() },
          {
            id: 'export image png svg pdf',
            label: t('menu.export'),
            icon: ExportIcon,
            shortcut: 'Ctrl+Shift+E',
            run: () => drawer.showExport(),
          },
          hasShapes && {
            id: 'copy image clipboard png',
            label: t('action.copyPng'),
            icon: ExportIcon,
            shortcut: 'Shift+Alt+C',
            run: () => drawer.copyImage('png'),
          },
          hasShapes && {
            id: 'copy image clipboard svg',
            label: t('action.copySvg'),
            icon: ExportIcon,
            shortcut: 'Shift+Alt+S',
            run: () => drawer.copyImage('svg'),
          },
          !!drawer.options.collaboration && {
            id: 'live collaboration share',
            label: t('menu.collaboration'),
            icon: UsersIcon,
            run: () => drawer.showCollaboration(),
          },
          !!drawer.collaboration && {
            id: 'live collaboration stop leave session',
            label: t(drawer.collaboration.isOwner ? 'collab.stop' : 'collab.leave'),
            icon: UsersIcon,
            run: () => drawer.stopCollaboration(),
          },
          !!collaboration?.isOwner && {
            id: 'present view presentation show screen collaboration',
            label: t('collab.present'),
            icon: EyeIcon,
            checked: collaboration.presenting,
            run: () => collaboration.present(!collaboration.presenting),
          },
          !!collaboration?.presentedView &&
            !collaboration.following && {
              id: 'follow presentation view owner collaboration',
              label: t('collab.followPresentation', {
                name: collaboration.members.find((member) => member.owner)?.name || t('collab.anonymous'),
              }),
              icon: EyeIcon,
              run: () => collaboration.follow(),
            },
          !!collaboration &&
            !collaboration.canEdit &&
            !collaboration.requested && {
              id: 'ask request draw right permission collaboration',
              label: t('collab.requestEdit'),
              icon: UsersIcon,
              run: () => collaboration.requestEdit(),
            },
          {
            id: 'clear storage',
            label: t('menu.clearStorage'),
            icon: StoreIcon,
            run: () => drawer.clearStoredData(),
          },
        ],
      ],
      [
        'menu.language',
        (['auto', ...Object.keys(languages)] as (Language | 'auto')[]).map((language) => ({
          id: `language ${language}`,
          label: t('commands.language', {
            name: language === 'auto' ? t('language.auto') : languages[language].name,
          }),
          icon: LanguageIcon,
          checked: drawer.languageChoice === language,
          run: () => drawer.setLanguage(language),
        })),
      ],
    ];

    // commands of plugins, at the end of the editor group
    groups.push(['help.editor', drawer.plugins._getPaletteCommands()]);

    return groups.flatMap(([group, commands]) =>
      commands
        .filter((command): command is Omit<Command, 'group'> => !!command)
        .map((command) => ({ ...command, group }))
    );
  }
}

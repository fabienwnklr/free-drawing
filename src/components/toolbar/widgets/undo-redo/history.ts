import Konva from 'konva';
import { ShapeConfig } from 'konva/lib/Shape';

export class History {
  public _currentStat: any[] = [];

  private _currentPointer: number = -1;
  private _history: Array<object[]> = [];

  /**
   * saveStateToHistory
   * save state to history
   * @param stat
   * @param onlyUpdateTheHistory this flag is used to update the history without incrementing the current pointer
   */
  public saveStateToHistory(stat: object[], onlyUpdateTheHistory: boolean = false): void {
    this._history = [...this._history, stat];
    // only increment the pointer if we are not only updating the history
    // this is used to update the history without incrementing the current pointer (specifically for undo/redo)
    if (!onlyUpdateTheHistory) {
      this._currentPointer++;
    }
  }

  /**
   * canUndo
   * checks if there is any state to undo
   */
  public canUndo(): boolean {
    return this._currentPointer > 0;
  }

  /**
   * undo
   * undo last state
   */
  public undo(): object[] | undefined {
    if (this._currentPointer === 0) {
      return;
    }
    this._currentPointer--;
    return this._history[this._currentPointer];
  }

  /**
   * canRedo
   * checks if there is any state to redo
   */
  public canRedo(): boolean {
    return this._currentPointer > -1 && this._currentPointer < this._history.length - 1;
  }

  /**
   * redo
   * redo last state
   */
  public redo(): object[] | undefined {
    if (this._currentPointer === this._history.length - 1) {
      return;
    }
    this._currentPointer += 1;
    return this._history[this._currentPointer];
  }

  /**
   * appendNewStat
   * appends new stat to current stat
   * @param shape
   */
  public appendNewStat(shape: Konva.Shape | Konva.Stage | Konva.Group): void {
    // get shape attributes
    const attrs = { ...shape.attrs };

    // verify if shape is a image then delete the image attribute from attrs because its hold HTMLImageElement
    if (shape instanceof Konva.Image) {
      // delete image attribute from attrs
      delete attrs['image'];
    } else if (shape instanceof Konva.Stage) {
      // delete container attribute from attrs
      delete attrs['container'];
    }
    this._currentStat = [...this._currentStat, attrs];
    this.saveStateToHistory(this._currentStat.slice());
  }

  /**
   * updateStat
   * updates a stat in history and adds new stat to current stat
   * @param shape
   * @param attrs
   * @param onlyUpdateTheHistory this flag is used to update the history without incrementing the current pointer
   */
  public updateState(
    shape: Konva.Shape | Konva.Shape[] | Konva.Stage | Konva.Group,
    attrs: Partial<ShapeConfig>,
    onlyUpdateTheHistory: boolean = false
  ): void {
    const shapes = Array.isArray(shape) ? shape : [shape];
    const shapeAttrs = { ...attrs };
    for (const shp of shapes) {
      // verify if shape is a image then delete the image attribute from attrs because its hold HTMLImageElement
      if (shp instanceof Konva.Image) {
        // delete image attribute from attrs
        delete shapeAttrs['image'];
      } else if (shape instanceof Konva.Stage) {
        // delete container attribute from attrs
        delete attrs['container'];
      }

      // get stateIndex
      const statIndex = this._currentStat.findIndex((stat) => stat.id === shp.id());

      this._currentStat = this._currentStat.slice();
      // update the current state
      this._currentStat[statIndex] = {
        ...this._currentStat[statIndex],
        ...shapeAttrs,
      };
    }

    // save state to history
    this.saveStateToHistory([...this._currentStat], onlyUpdateTheHistory);
  }

  /**
   * removeStat
   * removes a stat from history and adds new stat to current stat
   * @param shape
   */
  public removeState(shape: Konva.Shape): void {
    const statIndex = this._currentStat.findIndex((stat) => stat.id === shape.id());
    this._currentStat = this._currentStat.filter((stat, index) => index !== statIndex);
    this.saveStateToHistory(this._currentStat.slice());
  }
}

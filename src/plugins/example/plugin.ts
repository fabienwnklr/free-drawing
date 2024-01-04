import { MyClass } from '../../MyClass';
// import { ... } from '../../utils/dom'
import { deepMerge } from '../../utils/functions';
import type { myType } from './@types';

// importing style
import './plugin.scss';

/**
 * @name Template
 * Description of plugin
 * @param this
 * @param opts
 */
export default function (this: MyClass, opts: myType = {}) {
  const defaultOpts: myType = { prop1: '' };
  opts = deepMerge<myType>(opts, defaultOpts);

  console.log(opts);
  this.on('init', () => {
    // write your plugin ...
  });
}

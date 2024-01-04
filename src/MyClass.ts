import MicroEvent from './lib/MicroEvent';
import MicroPlugin from './lib/MicroPlugin';
// import ExamplePlugin from './plugins/example/plugin';
import './scss/style.scss';

export class MyClass extends MicroPlugin(MicroEvent) {
  param: any;
  constructor(param: any) {
    super();
    this.param = param;
  }
}

// MyClass.define('plugin-name', ExamplePlugin)

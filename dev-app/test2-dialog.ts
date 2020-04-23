import {autoinject} from 'aurelia-framework';
import {DialogController} from '../src';

@autoinject
export class Test2Dialog {
  model: any;

  constructor(private controller: DialogController) {
    this.controller.settings.escDismiss = false;
    this.controller.settings.overlayDismiss = false;
  }

  activate(model: any) {
    this.model = model;
  }
}

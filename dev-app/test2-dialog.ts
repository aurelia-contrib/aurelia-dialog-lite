import {autoinject} from 'aurelia-framework';
import {DialogController} from '../src';

@autoinject
export class Test2Dialog {
  model: any;

  constructor(private controller: DialogController) {
    this.controller = controller;
    this.controller.settings.lock = false;
    this.controller.settings.keyboard = true;
    this.controller.settings.overlayDismiss = true;
  }

  activate(model: any) {
    this.model = model;
  }
}

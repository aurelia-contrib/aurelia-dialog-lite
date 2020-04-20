import {autoinject} from 'aurelia-framework';
import {DialogController} from '../src';

@autoinject
export class TestDialog {
  model: any;

  constructor(private controller: DialogController) {
    this.controller = controller;
    this.controller.settings.overlayDismiss = true;
  }

  activate(model: any) {
    this.model = model;
  }
}

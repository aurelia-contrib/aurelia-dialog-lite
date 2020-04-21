import {autoinject} from 'aurelia-framework';
import {DialogService, DialogController} from '../src';
import {Test2Dialog} from './test2-dialog';

@autoinject
export class TestDialog {
  model: any;

  constructor(private dialogService: DialogService, private controller: DialogController) {
    this.dialogService = dialogService;
    this.controller = controller;
    this.controller.settings.lock = false;
    this.controller.settings.keyboard = true;
    this.controller.settings.overlayDismiss = true;
  }

  activate(model: any) {
    this.model = model;
  }

  openDialog() {
    this.dialogService.open({
      viewModel: Test2Dialog,
      model: {
        name: 'Test2'
      }
    }).whenClosed(response => {
      if (response.wasCancelled) return;
      console.log(response.output);
    })
  }
}

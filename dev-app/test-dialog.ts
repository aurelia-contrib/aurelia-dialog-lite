import {autoinject} from 'aurelia-framework';
import {DialogService, DialogController} from '../src';
import {Test2Dialog} from './test2-dialog';

@autoinject
export class TestDialog {
  model: any;

  constructor(private dialogService: DialogService, private controller: DialogController) {
    this.controller.settings.escDismiss = true;
    this.controller.settings.overlayDismiss = true;
  }

  activate(model: any) {
    this.model = model;
  }

  openDialog() {
    this.dialogService.create({
      viewModel: Test2Dialog,
      model: {
        name: 'Test2'
      }
    }).then(controller => {

      controller.closePromise.then(
        r => console.log('test2 result', r),
        e => console.error('test2 error', e),
      );

      setTimeout(() => controller.cancel('special'), 5000);
    });
  }
}

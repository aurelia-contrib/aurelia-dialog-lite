import {autoinject} from 'aurelia-framework';
import {DialogService} from '../src';
import {TestDialog} from './test-dialog';

@autoinject
export class App {
  constructor(private dialog: DialogService) {}

  openDialog() {
    this.dialog.open({
      viewModel: TestDialog,
      model: {
        name: 'Test'
      }
    }).whenClosed(response => {
      if (response.wasCancelled) return;
      console.log(response.output);
    })
  }
}

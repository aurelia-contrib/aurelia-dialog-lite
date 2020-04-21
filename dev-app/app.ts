import {autoinject} from 'aurelia-framework';
import {DialogService} from '../src';
import {TestDialog} from './test-dialog';

@autoinject
export class App {
  constructor(private dialogService: DialogService) {}

  openDialog() {
    this.dialogService.open({
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

import { Container } from 'aurelia-dependency-injection';
import { Loader } from 'aurelia-loader';
import { DefaultLoader } from 'aurelia-loader-default';
import { BindingLanguage, customElement, inlineView } from 'aurelia-templating';
import { TemplatingBindingLanguage } from 'aurelia-templating-binding';
import { DOM } from 'aurelia-pal';
import { DefaultDialogSettings, DialogSettings } from '../src/dialog-settings';
import { DialogController } from '../src/dialog-controller';
import { DialogService } from '../src/dialog-service';

@inlineView(`<template>
  <div class="dialog">
    <h2>\${title}</h2>
    <button id="cancelBtn" click.trigger="controller.cancel()">Cancel</button>
    <button id="cancelBtn2" click.trigger="controller.cancel('the reason')">Cancel with message</button>
    <button id="okBtn" click.trigger="controller.ok()">OK</button>
    <button id="okBtn2" click.trigger="controller.ok({a:1,b:'2'})">OK with output</button>
  </div>
</template>`)
@customElement('test-dialog')
export class TestDialog {
  public static inject = [DialogController];
  public title: string;

  constructor(public controller: DialogController) {}

  public activate(model: any) {
    this.title = model.title as string;
  }
}

async function delay(ms: number = 50) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

describe('DialogService', () => {
  let dialogService: DialogService;
  let container: Container;

  beforeEach(() => {
    container = new Container();
    container.registerSingleton(Loader, DefaultLoader);
    container.registerSingleton(BindingLanguage, TemplatingBindingLanguage);
    container.registerAlias(BindingLanguage, TemplatingBindingLanguage);
    container.registerSingleton(DefaultDialogSettings);
    dialogService = container.get(DialogService);
  });

  describe('create()', () => {
    it('shows dialog and resolves', async () => {
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);

      const dialogController = await dialogService.create({viewModel: TestDialog, model: { title: 'Test title'}});

      expect(dialogService.controllers.length).toBe(1);
      expect(dialogService.controllers[0]).toBe(dialogController);
      expect(dialogService.hasActiveDialog).toBe(true);

      const {host} = dialogController.settings;
      expect(dialogController.dialogOverlay.parentElement)
        .toBe(host as HTMLElement);
      expect(dialogController.dialogOverlay.className)
        .toBe('dialog-lite-overlay');

      const overlays = document.querySelectorAll('.dialog-lite-overlay');
      expect(overlays.length).toBe(1);
      expect(overlays[0].querySelector('h2').textContent).toBe('Test title');

      overlays[0].querySelector('#okBtn').dispatchEvent(new Event('click'));

      const result = await dialogController.closePromise;
      expect(result).toBeUndefined();
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);
    });

    it('shows dialog and resolves result, with custom overlayClassName', async () => {
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);

      const dialogController = await dialogService.create({viewModel: TestDialog, model: { title: 'Test title'}, overlayClassName: 'my-overlay'});

      expect(dialogService.controllers.length).toBe(1);
      expect(dialogService.controllers[0]).toBe(dialogController);
      expect(dialogService.hasActiveDialog).toBe(true);

      const {host} = dialogController.settings;
      expect(dialogController.dialogOverlay.parentElement)
        .toBe(host as HTMLElement);
      expect(dialogController.dialogOverlay.className)
        .toBe('my-overlay');

      const overlays = document.querySelectorAll('.dialog-lite-overlay');
      expect(overlays.length).toBe(0);
      const overlays2 = document.querySelectorAll('.my-overlay');
      expect(overlays2.length).toBe(1);
      expect(overlays2[0].querySelector('h2').textContent).toBe('Test title');

      overlays2[0].querySelector('#okBtn2').dispatchEvent(new Event('click'));

      const result = await dialogController.closePromise;
      expect(result).toEqual({a: 1, b: '2'});
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);
    });

    it('shows dialog and cancels', async () => {
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);

      const dialogController = await dialogService.create({viewModel: TestDialog, model: { title: 'Test title'}});

      expect(dialogService.controllers.length).toBe(1);
      expect(dialogService.controllers[0]).toBe(dialogController);
      expect(dialogService.hasActiveDialog).toBe(true);

      const {host} = dialogController.settings;
      expect(dialogController.dialogOverlay.parentElement)
        .toBe(host as HTMLElement);
      expect(dialogController.dialogOverlay.className)
        .toBe('dialog-lite-overlay');

      const overlays = document.querySelectorAll('.dialog-lite-overlay');
      expect(overlays.length).toBe(1);
      expect(overlays[0].querySelector('h2').textContent).toBe('Test title');

      overlays[0].querySelector('#cancelBtn').dispatchEvent(new Event('click'));

      try {
        await dialogController.closePromise;
        fail("should not see resolved result");
      } catch (e) {
        expect(e.message).toBe('cancelled');
        expect(dialogService.controllers.length).toBe(0);
        expect(dialogService.hasActiveDialog).toBe(false);
      }
    });

    it('shows dialog and cancels with customised message', async () => {
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);

      const dialogController = await dialogService.create({viewModel: TestDialog, model: { title: 'Test title'}});

      expect(dialogService.controllers.length).toBe(1);
      expect(dialogService.controllers[0]).toBe(dialogController);
      expect(dialogService.hasActiveDialog).toBe(true);

      const {host} = dialogController.settings;
      expect(dialogController.dialogOverlay.parentElement)
        .toBe(host as HTMLElement);
      expect(dialogController.dialogOverlay.className)
        .toBe('dialog-lite-overlay');

      const overlays = document.querySelectorAll('.dialog-lite-overlay');
      expect(overlays.length).toBe(1);
      expect(overlays[0].querySelector('h2').textContent).toBe('Test title');

      overlays[0].querySelector('#cancelBtn2').dispatchEvent(new Event('click'));

      try {
        await dialogController.closePromise;
        fail("should not see resolved result");
      } catch (e) {
        expect(e.message).toBe('the reason');
        expect(dialogService.controllers.length).toBe(0);
        expect(dialogService.hasActiveDialog).toBe(false);
      }
    });

    it('shows dialog and manually resolves', async () => {
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);

      const dialogController = await dialogService.create({viewModel: TestDialog, model: { title: 'Test title'}});

      expect(dialogService.controllers.length).toBe(1);
      expect(dialogService.controllers[0]).toBe(dialogController);
      expect(dialogService.hasActiveDialog).toBe(true);

      const {host} = dialogController.settings;
      expect(dialogController.dialogOverlay.parentElement)
        .toBe(host as HTMLElement);
      expect(dialogController.dialogOverlay.className)
        .toBe('dialog-lite-overlay');

      const overlays = document.querySelectorAll('.dialog-lite-overlay');
      expect(overlays.length).toBe(1);
      expect(overlays[0].querySelector('h2').textContent).toBe('Test title');

      dialogController.ok();

      const result = await dialogController.closePromise;
      expect(result).toBeUndefined();
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);
    });

    it('shows dialog and manually resolves result', async () => {
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);

      const dialogController = await dialogService.create({viewModel: TestDialog, model: { title: 'Test title'}});

      expect(dialogService.controllers.length).toBe(1);
      expect(dialogService.controllers[0]).toBe(dialogController);
      expect(dialogService.hasActiveDialog).toBe(true);

      const {host} = dialogController.settings;
      expect(dialogController.dialogOverlay.parentElement)
        .toBe(host as HTMLElement);
      expect(dialogController.dialogOverlay.className)
        .toBe('dialog-lite-overlay');

      const overlays = document.querySelectorAll('.dialog-lite-overlay');
      expect(overlays.length).toBe(1);
      expect(overlays[0].querySelector('h2').textContent).toBe('Test title');

      dialogController.ok({c:'d'});

      const result = await dialogController.closePromise;
      expect(result).toEqual({c:'d'});
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);
    });

    it('shows dialog and manually cancels', async () => {
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);

      const dialogController = await dialogService.create({viewModel: TestDialog, model: { title: 'Test title'}});

      expect(dialogService.controllers.length).toBe(1);
      expect(dialogService.controllers[0]).toBe(dialogController);
      expect(dialogService.hasActiveDialog).toBe(true);

      const {host} = dialogController.settings;
      expect(dialogController.dialogOverlay.parentElement)
        .toBe(host as HTMLElement);
      expect(dialogController.dialogOverlay.className)
        .toBe('dialog-lite-overlay');

      const overlays = document.querySelectorAll('.dialog-lite-overlay');
      expect(overlays.length).toBe(1);
      expect(overlays[0].querySelector('h2').textContent).toBe('Test title');

      dialogController.cancel();

      try {
        await dialogController.closePromise;
        fail("should not see resolved result");
      } catch (e) {
        expect(e.message).toBe('cancelled');
        expect(dialogService.controllers.length).toBe(0);
        expect(dialogService.hasActiveDialog).toBe(false);
      }
    });

    it('shows dialog and manually cancels with customised message', async () => {
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);

      const dialogController = await dialogService.create({viewModel: TestDialog, model: { title: 'Test title'}});

      expect(dialogService.controllers.length).toBe(1);
      expect(dialogService.controllers[0]).toBe(dialogController);
      expect(dialogService.hasActiveDialog).toBe(true);

      const {host} = dialogController.settings;
      expect(dialogController.dialogOverlay.parentElement)
        .toBe(host as HTMLElement);
      expect(dialogController.dialogOverlay.className)
        .toBe('dialog-lite-overlay');

      const overlays = document.querySelectorAll('.dialog-lite-overlay');
      expect(overlays.length).toBe(1);
      expect(overlays[0].querySelector('h2').textContent).toBe('Test title');

      dialogController.cancel('another reason');

      try {
        await dialogController.closePromise;
        fail("should not see resolved result");
      } catch (e) {
        expect(e.message).toBe('another reason');
        expect(dialogService.controllers.length).toBe(0);
        expect(dialogService.hasActiveDialog).toBe(false);
      }
    });
  });

  describe('open()', () => {
    it('opens dialog and resolves', async () => {
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);

      const closePromise = dialogService.open({viewModel: TestDialog, model: { title: 'Test title'}});
      await delay();

      expect(dialogService.controllers.length).toBe(1);
      expect(dialogService.hasActiveDialog).toBe(true);

      const overlays = document.querySelectorAll('.dialog-lite-overlay');
      expect(overlays.length).toBe(1);
      expect(overlays[0].querySelector('h2').textContent).toBe('Test title');

      overlays[0].querySelector('#okBtn').dispatchEvent(new Event('click'));

      const result = await closePromise;
      expect(result).toBeUndefined();
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);
    });

    it('opens dialog and resolves result', async () => {
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);

      const closePromise = dialogService.open({viewModel: TestDialog, model: { title: 'Test title'}});
      await delay();

      expect(dialogService.controllers.length).toBe(1);
      expect(dialogService.hasActiveDialog).toBe(true);

      const overlays = document.querySelectorAll('.dialog-lite-overlay');
      expect(overlays.length).toBe(1);
      expect(overlays[0].querySelector('h2').textContent).toBe('Test title');

      overlays[0].querySelector('#okBtn2').dispatchEvent(new Event('click'));

      const result = await closePromise;
      expect(result).toEqual({a: 1, b: '2'});
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);
    });

    it('opens dialog and cancels', async () => {
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);

      const closePromise = dialogService.open({viewModel: TestDialog, model: { title: 'Test title'}});
      await delay();

      expect(dialogService.controllers.length).toBe(1);
      expect(dialogService.hasActiveDialog).toBe(true);

      const overlays = document.querySelectorAll('.dialog-lite-overlay');
      expect(overlays.length).toBe(1);
      expect(overlays[0].querySelector('h2').textContent).toBe('Test title');

      overlays[0].querySelector('#cancelBtn').dispatchEvent(new Event('click'));

      try {
        await closePromise;
        fail("should not see resolved result");
      } catch (e) {
        expect(e.message).toBe('cancelled');
        expect(dialogService.controllers.length).toBe(0);
        expect(dialogService.hasActiveDialog).toBe(false);
      }
    });

    it('opens dialog and cancels with customised message', async () => {
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);

      const closePromise = dialogService.open({viewModel: TestDialog, model: { title: 'Test title'}});
      await delay();

      expect(dialogService.controllers.length).toBe(1);
      expect(dialogService.hasActiveDialog).toBe(true);

      const overlays = document.querySelectorAll('.dialog-lite-overlay');
      expect(overlays.length).toBe(1);
      expect(overlays[0].querySelector('h2').textContent).toBe('Test title');

      overlays[0].querySelector('#cancelBtn2').dispatchEvent(new Event('click'));

      try {
        await closePromise;
        fail("should not see resolved result");
      } catch (e) {
        expect(e.message).toBe('the reason');
        expect(dialogService.controllers.length).toBe(0);
        expect(dialogService.hasActiveDialog).toBe(false);
      }
    });
  });
});

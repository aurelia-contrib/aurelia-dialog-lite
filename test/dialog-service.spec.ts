import { Container } from 'aurelia-dependency-injection';
import { Loader } from 'aurelia-loader';
import { DefaultLoader } from 'aurelia-loader-default';
import { BindingLanguage, customElement, inlineView } from 'aurelia-templating';
import { TemplatingBindingLanguage } from 'aurelia-templating-binding';
import { DOM } from 'aurelia-pal';
import { DefaultDialogSettings, DialogSettings } from '../src/dialog-settings';
import { DialogController } from '../src/dialog-controller';
import { DialogService } from '../src/dialog-service';

const css = `.dialog-lite-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: block;
}
`;
DOM.injectStyles(css, DOM.querySelector('head'), true, 'dialog-lite-css');

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

@inlineView(`<template>
  <div class="dialog">
    <h2>\${title}</h2>
    <button id="d2-cancelBtn" click.trigger="controller.cancel('close')">Cancel</button>
    <button id="d2-okBtn" click.trigger="controller.ok({c:3})">OK</button>
  </div>
</template>`)
@customElement('test-dialog2')
export class TestDialog2 {
  public static inject = [DialogController];
  public title: string;

  constructor(public controller: DialogController) {
    this.controller.overlayDismiss = true;
    this.controller.escDismiss = true;
  }

  public activate(model: any) {
    this.title = model.title as string;
  }
}

async function delay(ms: number = 20) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function hit(options) {
  options.bubbles = true;
  document.activeElement.dispatchEvent(new KeyboardEvent('keydown', options));
  await delay();
  document.activeElement.dispatchEvent(new KeyboardEvent('keyup', options));
  await delay();
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

  describe('focus trap', () => {
    let btn;
    beforeEach(() => {
      btn = document.createElement('button');
      btn.id = 'btn';
      btn.textContent = 'in body';
      document.body.appendChild(btn);
      btn.focus();
    });

    afterEach(() => {
      document.querySelector('#btn').remove();
    });

    it('traps focus', async () => {
      expect(document.activeElement).toBe(btn);

      const closePromise = dialogService.open({viewModel: TestDialog, model: { title: 'Test title'}});
      await delay();

      // dialogService resets focus.
      expect(document.activeElement).toBe(document.body);
      await hit({key: 'Tab'});
      expect(document.activeElement.id).toBe('cancelBtn');
      await hit({key: 'Tab'});
      expect(document.activeElement.id).toBe('cancelBtn2');
      await hit({key: 'Tab'});
      expect(document.activeElement.id).toBe('okBtn');
      await hit({key: 'Tab'});
      expect(document.activeElement.id).toBe('okBtn2');
      await hit({key: 'Tab'});
      expect(document.activeElement.id).toBe('cancelBtn');
      await hit({key: 'Tab', shiftKey: true});
      expect(document.activeElement.id).toBe('okBtn2');
      await hit({key: 'Tab', shiftKey: true});
      expect(document.activeElement.id).toBe('okBtn');
      await hit({key: 'Tab', shiftKey: true});
      expect(document.activeElement.id).toBe('cancelBtn2');
      await hit({key: 'Tab', shiftKey: true});
      expect(document.activeElement.id).toBe('cancelBtn');
      await hit({key: 'Tab'});
      await hit({key: 'Tab'});
      // focus on #okBtn
      // Don't know what to simulate Enter or Space to let
      // browser fire click event (default behavior).
      // Just fire a click event here.
      document.activeElement.dispatchEvent(new Event('click'));

      const result = await closePromise;
      // dialogService restores focus.
      expect(document.activeElement).toBe(btn);

      expect(result).toBeUndefined();
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);
    });

    it('traps focus in stacks of dialogs', async () => {
      expect(document.activeElement).toBe(btn);

      const closePromise = dialogService.open({viewModel: TestDialog, model: { title: 'Test title'}});
      await delay();

      // dialogService resets focus.
      expect(document.activeElement).toBe(document.body);
      await hit({key: 'Tab'});
      expect(document.activeElement.id).toBe('cancelBtn');
      await hit({key: 'Tab'});
      expect(document.activeElement.id).toBe('cancelBtn2');
      await hit({key: 'Tab'});
      expect(document.activeElement.id).toBe('okBtn');
      await hit({key: 'Tab'});
      expect(document.activeElement.id).toBe('okBtn2');
      await hit({key: 'Tab'});
      expect(document.activeElement.id).toBe('cancelBtn');
      await hit({key: 'Tab', shiftKey: true});
      expect(document.activeElement.id).toBe('okBtn2');
      await hit({key: 'Tab', shiftKey: true});
      expect(document.activeElement.id).toBe('okBtn');
      await hit({key: 'Tab', shiftKey: true});
      expect(document.activeElement.id).toBe('cancelBtn2');
      await hit({key: 'Tab', shiftKey: true});
      expect(document.activeElement.id).toBe('cancelBtn');
      await hit({key: 'Tab'});
      await hit({key: 'Tab'});
      expect(document.activeElement.id).toBe('okBtn');

      const closePromise2 = dialogService.open({viewModel: TestDialog2, model: { title: 'Test title2'}});
      await delay();

      expect(dialogService.controllers.length).toBe(2);
      expect(dialogService.hasActiveDialog).toBe(true);

      let overlays = document.querySelectorAll('.dialog-lite-overlay');
      expect(overlays.length).toBe(2);
      expect(overlays[0].querySelector('h2').textContent).toBe('Test title');
      expect(overlays[1].querySelector('h2').textContent).toBe('Test title2');

      // dialogService resets focus.
      expect(document.activeElement).toBe(document.body);
      await hit({key: 'Tab'});
      expect(document.activeElement.id).toBe('d2-cancelBtn');
      await hit({key: 'Tab'});
      expect(document.activeElement.id).toBe('d2-okBtn');
      await hit({key: 'Tab'});
      expect(document.activeElement.id).toBe('d2-cancelBtn');
      await hit({key: 'Tab', shiftKey: true});
      expect(document.activeElement.id).toBe('d2-okBtn');
      await hit({key: 'Tab', shiftKey: true});
      expect(document.activeElement.id).toBe('d2-cancelBtn');

      document.activeElement.dispatchEvent(new Event('click'));

      try {
        await closePromise2;
        fail("should not see resolved result");
      } catch (e) {
        expect(e.message).toBe('close');
      }
      // dialogService restores previous focus.
      expect(document.activeElement.id).toBe('okBtn');

      expect(dialogService.controllers.length).toBe(1);
      expect(dialogService.hasActiveDialog).toBe(true);

      overlays = document.querySelectorAll('.dialog-lite-overlay');
      expect(overlays.length).toBe(1);
      expect(overlays[0].querySelector('h2').textContent).toBe('Test title');

      // focus on #okBtn
      // Don't know what to simulate Enter or Space to let
      // browser fire click event (default behavior).
      // Just fire a click event here.
      document.activeElement.dispatchEvent(new Event('click'));

      const result = await closePromise;
      // dialogService restores focus.
      expect(document.activeElement).toBe(btn);

      expect(result).toBeUndefined();
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);
    });

    it('traps focus in stacks of dialogs, but does not restore focus to detached dom', async () => {
      expect(document.activeElement).toBe(btn);

      const dialogController = await dialogService.create({viewModel: TestDialog, model: { title: 'Test title'}});

      // dialogService resets focus.
      expect(document.activeElement).toBe(document.body);
      await hit({key: 'Tab'});
      expect(document.activeElement.id).toBe('cancelBtn');

      const dialogController2 = await dialogService.create({viewModel: TestDialog2, model: { title: 'Test title2'}});

      // dialogService resets focus.
      expect(document.activeElement).toBe(document.body);
      await hit({key: 'Tab'});
      expect(document.activeElement.id).toBe('d2-cancelBtn');

      // close first dialog first
      dialogController.ok();
      await delay();
      // don't touch top dialog focus.
      expect(document.activeElement.id).toBe('d2-cancelBtn');

      expect(dialogService.controllers.length).toBe(1);
      expect(dialogService.hasActiveDialog).toBe(true);

      let overlays = document.querySelectorAll('.dialog-lite-overlay');
      expect(overlays.length).toBe(1);
      expect(overlays[0].querySelector('h2').textContent).toBe('Test title2');

      // close top dialog
      dialogController2.ok();
      await delay();

      // cannot restores focus to detached dialog.
      expect(document.activeElement).toBe(document.body);

      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);
      overlays = document.querySelectorAll('.dialog-lite-overlay');
      expect(overlays.length).toBe(0);
    });
  });

  describe('ESC dismiss', () => {
    it('by default does not dismiss dialog on ESC key', async () => {
      const closePromise = dialogService.open({viewModel: TestDialog, model: { title: 'Test title'}});
      await delay();

      await hit({key: 'Escape'});
      expect(dialogService.controllers.length).toBe(1);
      expect(dialogService.hasActiveDialog).toBe(true);

      document.querySelector('#okBtn2').dispatchEvent(new Event('click'));
      await closePromise;
    });

    it('dismisses dialog on ESC key, with escDismiss option', async () => {
      const closePromise = dialogService.open({
        viewModel: TestDialog,
        model: { title: 'Test title' },
        escDismiss: true
      });
      await delay();

      await hit({key: 'Escape'});

      try {
        await closePromise;
        fail("should not see resolved result");
      } catch (e) {
        expect(e.message).toBe('cancelled');
        expect(dialogService.controllers.length).toBe(0);
        expect(dialogService.hasActiveDialog).toBe(false);
      }
    });

    it('dismisses dialog on ESC key, with escDismiss option set by dialog', async () => {
      const closePromise = dialogService.open({viewModel: TestDialog2, model: { title: 'Test title' }});
      await delay();

      await hit({key: 'Escape'});

      try {
        await closePromise;
        fail("should not see resolved result");
      } catch (e) {
        expect(e.message).toBe('cancelled');
        expect(dialogService.controllers.length).toBe(0);
        expect(dialogService.hasActiveDialog).toBe(false);
      }
    });

    it('dismisses correct dialog on stacks', async () => {
      const closePromise = dialogService.open({
        viewModel: TestDialog,
        model: { title: 'Test title' },
        escDismiss: true
      });
      await delay();

      const closePromise2 = dialogService.open({
        viewModel: TestDialog2,
        model: { title: 'Test title2' }
      });
      await delay();

      expect(dialogService.controllers.length).toBe(2);
      expect(dialogService.hasActiveDialog).toBe(true);

      let overlays = document.querySelectorAll('.dialog-lite-overlay');
      expect(overlays.length).toBe(2);
      expect(overlays[1].querySelector('h2').textContent).toBe('Test title2');

      // cancel top dialog
      await hit({key: 'Escape'});

      try {
        await closePromise2;
        fail("should not see resolved result");
      } catch (e) {
        expect(e.message).toBe('cancelled');
      }

      expect(dialogService.controllers.length).toBe(1);
      expect(dialogService.hasActiveDialog).toBe(true);
      overlays = document.querySelectorAll('.dialog-lite-overlay');
      expect(overlays.length).toBe(1);
      expect(overlays[0].querySelector('h2').textContent).toBe('Test title');

      // cancel first dialog
      await hit({key: 'Escape'});

      try {
        await closePromise;
        fail("should not see resolved result");
      } catch (e) {
        expect(e.message).toBe('cancelled');
      }

      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);
    });
  });

  describe('overlay dismiss', () => {
    it('by default does not dismiss dialog on overlay click', async () => {
      const closePromise = dialogService.open({viewModel: TestDialog, model: { title: 'Test title'}});
      await delay();

      document.querySelector('.dialog-lite-overlay').dispatchEvent(new Event('mousedown'));
      document.querySelector('.dialog-lite-overlay').dispatchEvent(new Event('mouseup'));
      await delay();

      expect(dialogService.controllers.length).toBe(1);
      expect(dialogService.hasActiveDialog).toBe(true);

      document.querySelector('#okBtn2').dispatchEvent(new Event('click'));
      await closePromise;
    });

    it('dismisses dialog on overlay click, with overlayDismiss option', async () => {
      const closePromise = dialogService.open({
        viewModel: TestDialog,
        model: { title: 'Test title' },
        overlayDismiss: true
      });
      await delay();

      document.querySelector('.dialog-lite-overlay').dispatchEvent(new Event('mousedown'));
      document.querySelector('.dialog-lite-overlay').dispatchEvent(new Event('mouseup'));
      await delay();

      try {
        await closePromise;
        fail("should not see resolved result");
      } catch (e) {
        expect(e.message).toBe('cancelled');
        expect(dialogService.controllers.length).toBe(0);
        expect(dialogService.hasActiveDialog).toBe(false);
      }
    });

    it('dismisses dialog on overlay click, with overlayDismiss option set by dialog', async () => {
      const closePromise = dialogService.open({viewModel: TestDialog2, model: { title: 'Test title' }});
      await delay();

      document.querySelector('.dialog-lite-overlay').dispatchEvent(new Event('mousedown'));
      document.querySelector('.dialog-lite-overlay').dispatchEvent(new Event('mouseup'));
      await delay();

      try {
        await closePromise;
        fail("should not see resolved result");
      } catch (e) {
        expect(e.message).toBe('cancelled');
        expect(dialogService.controllers.length).toBe(0);
        expect(dialogService.hasActiveDialog).toBe(false);
      }
    });

    it('dismisses dialog on overlay click, with overlayDismiss option, with custom overlayClassName', async () => {
      const closePromise = dialogService.open({
        viewModel: TestDialog,
        model: { title: 'Test title' },
        overlayDismiss: true,
        overlayClassName: 'dialog-lite-overlay my-overlay'
      });
      await delay();

      document.querySelector('.dialog-lite-overlay').dispatchEvent(new Event('mousedown'));
      document.querySelector('.dialog-lite-overlay').dispatchEvent(new Event('mouseup'));
      await delay();

      try {
        await closePromise;
        fail("should not see resolved result");
      } catch (e) {
        expect(e.message).toBe('cancelled');
        expect(dialogService.controllers.length).toBe(0);
        expect(dialogService.hasActiveDialog).toBe(false);
      }
    });

    it('dismisses correct dialog on stacks', async () => {
      const closePromise = dialogService.open({
        viewModel: TestDialog,
        model: { title: 'Test title' },
        overlayDismiss: true
      });
      await delay();

      const closePromise2 = dialogService.open({
        viewModel: TestDialog2,
        model: { title: 'Test title2' }
      });
      await delay();

      expect(dialogService.controllers.length).toBe(2);
      expect(dialogService.hasActiveDialog).toBe(true);
      let overlays = document.querySelectorAll('.dialog-lite-overlay');
      expect(overlays.length).toBe(2);
      expect(overlays[1].querySelector('h2').textContent).toBe('Test title2');

      // cancel top dialog
      overlays[1].dispatchEvent(new Event('mousedown'));
      overlays[1].dispatchEvent(new Event('mouseup'));

      try {
        await closePromise2;
        fail("should not see resolved result");
      } catch (e) {
        expect(e.message).toBe('cancelled');
      }

      expect(dialogService.controllers.length).toBe(1);
      expect(dialogService.hasActiveDialog).toBe(true);
      overlays = document.querySelectorAll('.dialog-lite-overlay');
      expect(overlays.length).toBe(1);
      expect(overlays[0].querySelector('h2').textContent).toBe('Test title');

      // cancel first dialog
      overlays[0].dispatchEvent(new Event('mousedown'));
      overlays[0].dispatchEvent(new Event('mouseup'));

      try {
        await closePromise;
        fail("should not see resolved result");
      } catch (e) {
        expect(e.message).toBe('cancelled');
      }

      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);
    });
  });

  describe('cancelAll', () => {
    it('returns resolved promise if no active dialog', async () => {
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);

      await dialogService.cancelAll();
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);
    });

    it('cancels dialogs', async () => {
      const closePromise = dialogService.open({
        viewModel: TestDialog,
        model: { title: 'Test title' },
        overlayDismiss: true
      });
      await delay();

      const closePromise2 = dialogService.open({
        viewModel: TestDialog2,
        model: { title: 'Test title2' }
      });
      await delay();

      expect(dialogService.controllers.length).toBe(2);
      expect(dialogService.hasActiveDialog).toBe(true);

      await dialogService.cancelAll();
      await delay();
      expect(dialogService.controllers.length).toBe(0);
      expect(dialogService.hasActiveDialog).toBe(false);

      try {
        await closePromise;
        fail("should not see resolved result");
      } catch (e) {
        expect(e.message).toBe('cancelled');
      }

      try {
        await closePromise2;
        fail("should not see resolved result");
      } catch (e) {
        expect(e.message).toBe('cancelled');
      }
    });
  });
});

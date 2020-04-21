import { DOM } from 'aurelia-pal';
import { transient } from 'aurelia-dependency-injection';
import type { DialogController } from './dialog-controller';
import type { ActionKey } from './dialog-settings';

class DialogRenderer {
  public static dialogControllers: DialogController[] = [];

  public static keyboardEventHandler(e: KeyboardEvent) {
    const { key } = e;
    if (!key) return;
    const top = DialogRenderer.dialogControllers[DialogRenderer.dialogControllers.length - 1];
    if (!top) return;
    if (!top.settings.keyboard) return;
    const keyboard = top.settings.keyboard;
    if (key === 'Escape'
      && (keyboard === true || keyboard === key || (Array.isArray(keyboard) && keyboard.indexOf(key) > -1))) {
      top.cancel();
    } else if (key === 'Enter' && (keyboard === key || (Array.isArray(keyboard) && keyboard.indexOf(key) > -1))) {
      top.ok();
    }
  }

  public static tabDownHandler(e: KeyboardEvent) {
    const { key } = e;
    if (!key || key !== 'Tab') return;
    const top = DialogRenderer.dialogControllers[DialogRenderer.dialogControllers.length - 1];
    if (!top) return;
    top.retainFocus(e);
  }

  public static trackController(dialogController: DialogController): void {
    const trackedDialogControllers = DialogRenderer.dialogControllers;
    if (!trackedDialogControllers.length) {
      DOM.addEventListener('keyup', DialogRenderer.keyboardEventHandler, false);
      DOM.addEventListener('keydown', DialogRenderer.tabDownHandler, false);
    }
    trackedDialogControllers.push(dialogController);
  }

  public static untrackController(dialogController: DialogController): void {
    const trackedDialogControllers = DialogRenderer.dialogControllers;
    const i = trackedDialogControllers.indexOf(dialogController);
    if (i !== -1) {
      trackedDialogControllers.splice(i, 1);
    }
    if (!trackedDialogControllers.length) {
      DOM.removeEventListener('keyup', DialogRenderer.keyboardEventHandler, false);
      DOM.removeEventListener('keydown', DialogRenderer.tabDownHandler, false);
    }
  }

  public lastActiveElement: HTMLElement;
  public host: Element;

  private attach(dialogController: DialogController): void {
    this.lastActiveElement = DOM.activeElement as HTMLElement;
    if (this.lastActiveElement) this.lastActiveElement.blur();

    this.host.appendChild(dialogController.dialogOverlay);
    dialogController.controller.attached();
  }

  private detach(dialogController: DialogController): void {
    this.host.removeChild(dialogController.dialogOverlay);
    dialogController.controller.detached();
    if (this.lastActiveElement) {
      this.lastActiveElement.focus();
    }
  }

  private setupEventHandling(dialogController: DialogController): void {
    dialogController.dialogOverlay.addEventListener('click', dialogController.cancelOnOverlay);
    dialogController.dialogOverlay.addEventListener('touchstart', dialogController.cancelOnOverlay);
  }

  private clearEventHandling(dialogController: DialogController): void {
    dialogController.dialogOverlay.removeEventListener('click', dialogController.cancelOnOverlay);
    dialogController.dialogOverlay.removeEventListener('touchstart', dialogController.cancelOnOverlay);
  }

  public showDialog(dialogController: DialogController): void {
    this.host = dialogController.settings.host;
    this.attach(dialogController);
    DialogRenderer.trackController(dialogController);
    this.setupEventHandling(dialogController);
  }

  public hideDialog(dialogController: DialogController) {
    this.clearEventHandling(dialogController);
    DialogRenderer.untrackController(dialogController);
    this.detach(dialogController);
  }
}

// avoid unnecessary code
transient()(DialogRenderer);

export { DialogRenderer };

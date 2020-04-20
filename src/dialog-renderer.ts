import { DOM } from 'aurelia-pal';
import { transient } from 'aurelia-dependency-injection';
import type { DialogController } from './dialog-controller';
import type { ActionKey } from './dialog-settings';

function getActionKey(e: KeyboardEvent): ActionKey | undefined {
  if ((e.code || e.key) === 'Escape' || e.keyCode === 27) {
    return 'Escape';
  }
  if ((e.code || e.key) === 'Enter' || e.keyCode === 13) {
    return 'Enter';
  }
  return undefined;
}

class DialogRenderer {
  public static dialogControllers: DialogController[] = [];

  public static keyboardEventHandler(e: KeyboardEvent) {
    const key = getActionKey(e);
    if (!key) { return; }
    const top = DialogRenderer.dialogControllers[DialogRenderer.dialogControllers.length - 1];
    if (!top || !top.settings.keyboard) { return; }
    const keyboard = top.settings.keyboard;
    if (key === 'Escape'
      && (keyboard === true || keyboard === key || (Array.isArray(keyboard) && keyboard.indexOf(key) > -1))) {
      top.cancel();
    } else if (key === 'Enter' && (keyboard === key || (Array.isArray(keyboard) && keyboard.indexOf(key) > -1))) {
      top.ok();
    }
  }

  public static trackController(dialogController: DialogController): void {
    const trackedDialogControllers = DialogRenderer.dialogControllers;
    if (!trackedDialogControllers.length) {
      DOM.addEventListener('keyup', DialogRenderer.keyboardEventHandler, false);
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
      DOM.removeEventListener(
        'keyup',
        DialogRenderer.keyboardEventHandler,
        false
      );
    }
  }

  public lastActiveElement: HTMLElement;
  public host: Element;

  private attach(dialogController: DialogController): void {
    if (dialogController.settings.restoreFocus) {
      this.lastActiveElement = DOM.activeElement as HTMLElement;
    }

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
    dialogController.dialogOverlay.addEventListener('touch', dialogController.cancelOnOverlay);
  }

  private clearEventHandling(dialogController: DialogController): void {
    dialogController.dialogOverlay.removeEventListener('click', dialogController.cancelOnOverlay);
    dialogController.dialogOverlay.removeEventListener('touch', dialogController.cancelOnOverlay);
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

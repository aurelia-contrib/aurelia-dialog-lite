import { DOM } from 'aurelia-pal';
import { Container } from 'aurelia-dependency-injection';
import { CompositionEngine, Controller, ViewSlot, CompositionContext } from 'aurelia-templating';
import { DialogContextSettings, DialogSettings, DefaultDialogSettings } from './dialog-settings';
import { DialogController } from './dialog-controller';

/**
 * A service allowing for the creation of dialogs.
 */
export class DialogService {
  /**
   * The current dialog controllers
   */
  public controllers: DialogController[] = [];

  /**
   * @internal
   */
  private _controllers: Controller[] = [];
  private _lastActives: HTMLElement[] = [];

  /**
   * Is there an open dialog
   */
  public hasActiveDialog: boolean = false;

  /**
   * @internal
   */
  public static inject = [Container, CompositionEngine, DefaultDialogSettings];
  constructor(
    private container: Container,
    private compositionEngine: CompositionEngine,
    private defaultSettings: DialogSettings) {
    this.escAndTab = this.escAndTab.bind(this);
    this._hideDialog = this._hideDialog.bind(this);
  }

  private composeAndShowDialog(compositionContext: CompositionContext, dialogController: DialogController): Promise<DialogController> {
    if (!compositionContext.viewModel) {
      // provide access to the dialog controller for view only dialogs
      compositionContext.bindingContext = { controller: dialogController };
    }
    return this.compositionEngine
      .compose(compositionContext)
      .then((controller: Controller) => {
        this._showDialog(dialogController, controller);
        return dialogController;
      });
  }

  /**
   * Cancel all active dialog.
   * @return Promise A promise that settles when all dialogs are cancelled.
   */
  public cancelAll(): Promise<void> {
    let p = Promise.resolve();
    for (let i = this.controllers.length - 1; i >= 0; i--) {
      const controller = this.controllers[i];
      p = p.then(() => {
        controller.cancel();
        return controller.closePromise.catch(() => undefined);
      })
    }
    return p;
  }

  /**
   * Opens a new dialog, same as
   *   dialogService.create(settings).then(controller => controller.closePromise).
   * @param settings Dialog settings for this dialog instance.
   * @return Promise A promise that settles when the dialog is closed.
   */
  public open(contextSettings: DialogContextSettings = {}): Promise<any> {
    return this.create(contextSettings).then(
      dialogController => dialogController.closePromise
    );
  }

  /**
   * Opens a new dialog and resolves to the dialog controller
   * @param contextSettings Dialog settings for creating this dialog instance.
   * @return Promise A promise that resolves to a dialog controller.
   */
  public create(contextSettings: DialogContextSettings = {}): Promise<DialogController> {
    const { viewModel, view, model, ...settings } = contextSettings;
    if (!viewModel && !view) {
      return Promise.reject(
        new Error('Invalid dialog context settings. You must provide "viewModel", "view" or both.')
      );
    }

    const childContainer = this.container.createChild();
    const dialogController = childContainer.invoke(
      DialogController,
      [
        Object.assign({}, this.defaultSettings, settings),
        this._hideDialog
      ]
    );
    childContainer.registerInstance(DialogController, dialogController);

    const compositionContext = {
      container: this.container,
      childContainer,
      bindingContext: null,
      viewResources: null as any,
      model,
      view,
      viewModel,
      viewSlot: new ViewSlot(dialogController.dialogOverlay, true),
      host: dialogController.dialogOverlay
    };

    return this.composeAndShowDialog(compositionContext, dialogController);
  }

  /**
   * @internal
   */
  private _showDialog(dialogController: DialogController, controller: Controller): void {
    this.controllers.push(dialogController);
    this._controllers.push(controller);
    const lastActive = DOM.activeElement as HTMLElement;
    this._lastActives.push(lastActive);
    if (lastActive) lastActive.blur();

    dialogController.host.appendChild(dialogController.dialogOverlay);
    controller.attached();

    dialogController.dialogOverlay.addEventListener('click', dialogController.cancelOnOverlay);
    dialogController.dialogOverlay.addEventListener('touchstart', dialogController.cancelOnOverlay);

    if (!this.hasActiveDialog) {
      this.hasActiveDialog = true;
      DOM.addEventListener('keydown', this.escAndTab, false);
    }
  }

  /**
   * @internal
   */
  private _hideDialog(dialogController: DialogController): boolean {
    const i = this.controllers.indexOf(dialogController);
    if (i === -1) return false;

    this.controllers.splice(i, 1);
    const controller = this._controllers.splice(i, 1)[0];
    const lastActive = this._lastActives.splice(i, 1)[0];

    dialogController.dialogOverlay.removeEventListener('click', dialogController.cancelOnOverlay);
    dialogController.dialogOverlay.removeEventListener('touchstart', dialogController.cancelOnOverlay);

    dialogController.host.removeChild(dialogController.dialogOverlay);
    controller.detached();
    controller.unbind();
    if (
      // Only restore last focus if the closed dialog is the top one.
      i === this.controllers.length &&
      lastActive &&
      // Only restore if it's in the DOM tree.
      // On browsers (e.g. IE) without .isConnected, last focus is
      // never restored, which is not a big issue.
      lastActive.isConnected
    ) {
      lastActive.focus();
    }

    if (this.controllers.length === 0 && this.hasActiveDialog) {
      this.hasActiveDialog = false;
      DOM.removeEventListener('keydown', this.escAndTab, false);
    }

    return true;
  }

  /**
   * @internal
   */
  private escAndTab(e: KeyboardEvent) {
    const { key } = e;
    const top = this.controllers[this.controllers.length - 1];
    if (!top) return;
    if (key === 'Tab') {
      top.retainFocus(e);
    } else if (key === 'Escape' && top.escDismiss) {
      top.cancel();
    }
  }
}

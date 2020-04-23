import { DOM } from 'aurelia-pal';
import { Container } from 'aurelia-dependency-injection';
import { CompositionEngine, Controller, ViewSlot, CompositionContext } from 'aurelia-templating';
import { DialogSettings, DefaultDialogSettings } from './dialog-settings';
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
  }

  private composeAndShowDialog(compositionContext: CompositionContext, dialogController: DialogController): Promise<DialogController> {
    if (!compositionContext.viewModel) {
      // provide access to the dialog controller for view only dialogs
      compositionContext.bindingContext = { controller: dialogController };
    }
    return this.compositionEngine
      .compose(compositionContext)
      .then((controller: Controller) => {
        dialogController.controller = controller;
        dialogController.show();
        this.addController(dialogController);
        return dialogController;
      });
  }

  /**
   * Opens a new dialog, same as
   *   dialogService.create(settings).then(controller => controller.closePromise).
   * @param settings Dialog settings for this dialog instance.
   * @return Promise A promise that settles when the dialog is closed.
   */
  public open(settings: DialogSettings = {}): Promise<any> {
    return this.create(settings).then(
      dialogController => dialogController.closePromise
    );
  }

  /**
   * Opens a new dialog and resolves to the dialog controller
   * @param settings Dialog settings for this dialog instance.
   * @return Promise A promise that resolves to dialog controller.
   */
  public create(settings: DialogSettings = {}): Promise<DialogController> {
    settings = Object.assign({}, this.defaultSettings, settings);
    if (!settings.viewModel && !settings.view) {
      return Promise.reject(
        new Error('Invalid Dialog Settings. You must provide "viewModel", "view" or both.')
      );
    }

    const childContainer = this.container.createChild();
    const dialogController = childContainer.invoke(DialogController, [settings]);
    childContainer.registerInstance(DialogController, dialogController);
    dialogController.closePromise.catch(() => null).then(
      () => this.removeController(dialogController)
    );

    const compositionContext = {
      container: this.container,
      childContainer,
      bindingContext: null,
      viewResources: null as any,
      model: settings.model,
      view: settings.view,
      viewModel: settings.viewModel,
      viewSlot: new ViewSlot(dialogController.dialogOverlay, true),
      host: dialogController.dialogOverlay
    };

    return this.composeAndShowDialog(compositionContext, dialogController);
  }

  /**
   * @internal
   */
  private addController(dialogController: DialogController): void {
    this.controllers.push(dialogController);
    if (!this.hasActiveDialog) {
      this.hasActiveDialog = true;
      DOM.addEventListener('keydown', this.escAndTab, false);
    }
  }

  /**
   * @internal
   */
  private removeController(dialogController: DialogController): void {
    const i = this.controllers.indexOf(dialogController);
    if (i !== -1) {
      this.controllers.splice(i, 1);
      if (this.controllers.length === 0 && this.hasActiveDialog) {
        this.hasActiveDialog = false;
        DOM.removeEventListener('keydown', this.escAndTab, false);
      }
    }
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
    } else if (key === 'Escape' && top.settings.escDismiss) {
      top.cancel();
    }
  }
}

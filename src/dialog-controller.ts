import { DOM } from 'aurelia-pal';
import { Controller } from 'aurelia-templating';
import type { DialogCancelableOperationResult, DialogCloseResult, DialogCancelResult } from './dialog-result';
import { DialogRenderer } from './dialog-renderer';
import type { DialogSettings } from './dialog-settings';
import { invokeLifecycle } from './lifecycle';
import { createDialogCloseError, DialogCloseError } from './dialog-close-error';
import { createDialogCancelError } from './dialog-cancel-error';

/**
 * A controller object for a Dialog instance.
 */
export class DialogController {
  private resolve: (data?: any) => void;
  private reject: (reason: any) => void;

  /**
   * @internal
   */
  public closePromise: Promise<any> | undefined;

  /**
   * The settings used by this controller.
   */
  public renderer: DialogRenderer;
  public settings: DialogSettings;
  public controller: Controller;
  public dialogOverlay: HTMLElement;

  /**
   * @internal
   */
  // tslint:disable-next-line:member-ordering
  public static inject = [DialogRenderer];
  /**
   * Creates an instance of DialogController.
   */
  constructor(
    renderer: DialogRenderer,
    settings: DialogSettings,
    resolve: (data?: any) => void,
    reject: (reason: any) => void) {
    this.renderer = renderer;
    this.settings = settings;
    this.resolve = resolve;
    this.reject = reject;
    this.cancelOnOverlay = this.cancelOnOverlay.bind(this);

    this.dialogOverlay = DOM.createElement('div') as HTMLElement;
    this.dialogOverlay.classList.add('dialog-lite-overlay');
  }

  /**
   * @internal
   */
  public releaseResources(result: DialogCloseResult | DialogCloseError): Promise<void> {
    return invokeLifecycle(this.controller.viewModel || {}, 'deactivate', result)
      .then(() => this.renderer.hideDialog(this))
      .then(() => {
        this.controller.unbind();
      });
  }

  /**
   * @internal
   */
  public cancelOperation(): DialogCancelResult {
    if (!this.settings.rejectOnCancel) {
      return { wasCancelled: true };
    }
    throw createDialogCancelError();
  }

  /**
   * Closes the dialog with a successful output.
   * @param output The returned success output.
   */
  public ok(output?: any): Promise<DialogCancelableOperationResult> {
    return this.close(true, output);
  }

  /**
   * Closes the dialog with a cancel output.
   * @param output The returned cancel output.
   */
  public cancel(output?: any): Promise<DialogCancelableOperationResult> {
    return this.close(false, output);
  }

  /**
   * @internal
   */
  public cancelOnOverlay(event: Event): Promise<DialogCancelableOperationResult> {
    if (this.settings.overlayDismiss && event.target === this.dialogOverlay) {
      return this.close(false);
    }
  }

  /**
   * Closes the dialog with an error output.
   * @param output A reason for closing with an error.
   * @returns Promise An empty promise object.
   */
  public error(output: any): Promise<void> {
    const closeError = createDialogCloseError(output);
    return this.releaseResources(closeError).then(() => { this.reject(closeError); });
  }

  /**
   * Closes the dialog.
   * @param ok Whether or not the user input signified success.
   * @param output The specified output.
   * @returns Promise An empty promise object.
   */
  public close(ok: boolean, output?: any): Promise<DialogCancelableOperationResult> {
    if (this.closePromise) {
      return this.closePromise;
    }

    const dialogResult: DialogCloseResult = { wasCancelled: !ok, output };

    return this.closePromise = invokeLifecycle(this.controller.viewModel || {}, 'canDeactivate', dialogResult)
      .catch(reason => {
        this.closePromise = undefined;
        return Promise.reject(reason);
      }).then(canDeactivate => {
        if (!canDeactivate) {
          this.closePromise = undefined; // we are done, do not block consecutive calls
          return this.cancelOperation();
        }
        return this.releaseResources(dialogResult).then(() => {
          if (!this.settings.rejectOnCancel || ok) {
            this.resolve(dialogResult);
          } else {
            this.reject(createDialogCancelError(output));
          }
          return { wasCancelled: false };
        }).catch(reason => {
          this.closePromise = undefined;
          return Promise.reject(reason);
        });
      });
  }
}

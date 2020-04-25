import { DOM } from 'aurelia-pal';
import type { Controller } from 'aurelia-templating';
import type { DialogSettings } from './dialog-settings';

// https://github.com/ghosh/Micromodal
const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
  'select:not([disabled]):not([aria-hidden])',
  'textarea:not([disabled]):not([aria-hidden])',
  'button:not([disabled]):not([aria-hidden])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex^="-"])'
].join(', ');

/**
 * A controller object for a Dialog instance.
 */
export class DialogController {
  /**
   * The settings used by this controller.
   */
  public dialogOverlay: HTMLElement;
  public closePromise: Promise<any>;

  /**
   * @internal
   */
  private _resolve: (output?: any) => void;
  private _reject: (reason: Error) => void;

  /**
   * Creates an instance of DialogController.
   */
  constructor(
    public settings: DialogSettings,
    private _hideDialog: (dialogController: DialogController) => boolean
  ) {
    this.dialogOverlay = DOM.createElement('div') as HTMLElement;
    this.dialogOverlay.classList.add(settings.overlayClassName);

    this.closePromise = new Promise<any>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });

    this.cancelOnOverlay = this.cancelOnOverlay.bind(this);
    this.ok = this.ok.bind(this);
    this.cancel = this.cancel.bind(this);
  }

  /**
   * Closes the dialog with a successful output.
   * @param output The returned success output in closePromise.
   */
  public ok(output?: any): void {
    this.close(true, output);
  }

  /**
   * Cancels the dialog with a optional reason.
   * @param reason The returned cancel reason in closePromise.
   */
  public cancel(reason: string = 'cancelled'): void {
    this.close(false, new Error(reason));
  }

  /**
   * @internal
   */
  public cancelOnOverlay(event: Event): void {
    if (this.settings.overlayDismiss && event.target === this.dialogOverlay) {
      this.cancel();
    }
  }

  /**
   * @internal
   */
  private close(ok: boolean, output?: any): void {
    // tslint:disable-next-line:no-string-literal
    if (this._hideDialog(this)) {
      if (ok) {
        this._resolve(output);
      } else {
        this._reject(output as Error);
      }
    }
  }

  /**
   * @internal
   */
  private getFocusableNodes(): HTMLElement[] {
    const nodes = this.dialogOverlay.querySelectorAll(FOCUSABLE_ELEMENTS)
    return Array.from(nodes) as HTMLElement[];
  }

  /**
   * @internal
   */
  public retainFocus(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    event.stopPropagation(); // Stop others listening on Tab.
    event.preventDefault();

    let focusableNodes = this.getFocusableNodes();

    // no focusable nodes
    if (focusableNodes.length === 0) return;

    // Filters nodes which are hidden to prevent focus leak outside modal.
    focusableNodes = focusableNodes.filter(node => node.offsetParent);

    const active = DOM.activeElement as HTMLElement;
    if (!this.dialogOverlay.contains(active)) {
      focusableNodes[0].focus();
    } else {
      const index = focusableNodes.indexOf(active);
      let nextIndex = index + (event.shiftKey ? -1 : 1);
      if (nextIndex >= focusableNodes.length) nextIndex = 0;
      else if (nextIndex < 0) nextIndex = focusableNodes.length - 1;
      focusableNodes[nextIndex].focus();
    }
  }
}

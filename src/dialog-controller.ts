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
export class DialogController implements DialogSettings {
  /**
   * The settings used by this controller.
   */
  public dialogOverlay: HTMLElement;
  public closePromise: Promise<any>;
  public host: HTMLBodyElement;
  public overlayClassName: string;
  public escDismiss: boolean;
  public overlayDismiss: boolean;

  /**
   * @internal
   */
  private _resolve: (output?: any) => void;
  private _reject: (reason: Error) => void;
  private _overlayMousedown: boolean = false;
  private _resetOverlayMousedown: ReturnType<typeof setTimeout> | null = null;

  /**
   * Creates an instance of DialogController.
   */
  constructor(
    public settings: DialogSettings,
    private _hideDialog: (dialogController: DialogController) => boolean
  ) {
    Object.assign(this, settings);
    this.dialogOverlay = DOM.createElement('div') as HTMLElement;
    this.dialogOverlay.className = this.overlayClassName;

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
    if (event.type === 'mousedown') {
      if (this.overlayDismiss && event.target === this.dialogOverlay) {
        this._overlayMousedown = true;
        this._resetOverlayMousedown = setTimeout(() => {
          this._overlayMousedown = false;
          this._resetOverlayMousedown = null;
        }, 2000);
      }
    } else if (event.type === 'mouseup' && this._overlayMousedown) {
      clearTimeout(this._resetOverlayMousedown);
      this._overlayMousedown = false;
      this._resetOverlayMousedown = null;
      if (this.overlayDismiss && event.target === this.dialogOverlay) {
        this.cancel();
      }
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
    // Someone called preventDefault().
    if (event.defaultPrevented) return;

    event.stopPropagation(); // Stop others listening on Tab.
    event.preventDefault();

    let focusableNodes = this.getFocusableNodes();
    // Filters nodes which are hidden to prevent focus leak outside modal.
    focusableNodes = focusableNodes.filter(node => node.offsetParent);

    const size = focusableNodes.length;
    // no focusable nodes
    if (size === 0) return;
    if (size === 1) {
      focusableNodes[0].focus();
    }

    const currentActive = DOM.activeElement as HTMLElement;
    currentActive.blur();
    let currentIndex = focusableNodes.indexOf(currentActive);

    function nextIndex(index: number) {
      let ni = index + (event.shiftKey ? -1 : 1);
      if (ni >= size) ni = 0;
      else if (ni < 0) ni = size - 1;
      return ni;
    }

    let tryIndex: number | undefined;
    for (let i = 0; i < size; i++) {
      tryIndex = nextIndex(tryIndex === undefined ? currentIndex : tryIndex);
      const node = focusableNodes[tryIndex];
      node.focus();
      // Return if focused, otherwise try next.
      // Maximum try (size) times.
      if (DOM.activeElement === node) break;
    }
  }
}

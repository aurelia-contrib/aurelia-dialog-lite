import type { ViewStrategy } from 'aurelia-templating';
import { DOM } from 'aurelia-pal';

/**
 * All available dialog settings.
 */
export interface DialogSettings {
  /**
   * The element that will parent the dialog.
   * Default to document.body.
   */
  host?: Element;

  /**
   * The CSS class name for the overlay element.
   * An overlay element is created for every dialog, it hosts dialog view.
   * When showing the dialog its overlay element is inserted to host element.
   * Default to 'dialog-lite-overlay'.
   */
  overlayClassName?: string;

  /**
   * Allows for closing the top most dialog via the keyboard ESC key.
   * When set to "false" no action will be taken.
   * When set to "true" the dialog will be "cancel" closed when the ESC key is pressed.
   */
  escDismiss?: boolean;

  /**
   * When set to "true" allows for the dismissal of the dialog by clicking outside of it.
   */
  overlayDismiss?: boolean;
}

/**
 * All possible dialog context and settings.
 */
export interface DialogContextSettings extends DialogSettings {
  /**
   * The view model url, constructor or instance for the dialog.
   */
  viewModel?: any;

  /**
   * The view url or view strategy to override the default view location convention.
   */
  view?: string | ViewStrategy;

  /**
   * Data to be passed to the "activate" hook on the view model.
   */
  model?: any;
}

/**
 * @internal
 */
export class DefaultDialogSettings implements DialogSettings {
  public host = DOM.querySelector('body') as HTMLBodyElement;
  public overlayClassName = 'dialog-lite-overlay';
  public escDismiss = false;
  public overlayDismiss = false;
}

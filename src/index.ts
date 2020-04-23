import type { FrameworkConfiguration } from 'aurelia-framework';
import { DialogSettings, DefaultDialogSettings } from './dialog-settings';
import { DOM } from 'aurelia-pal';

const css = `.dialog-lite-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
`;

export function configure(
  config: FrameworkConfiguration,
  settings?: Omit<DialogSettings, 'viewModel' | 'view' | 'model'>
): void | Promise<void> {
  // Put css on top of head, in order to allow easier user override
  DOM.injectStyles(css, DOM.querySelector('head'), true, 'dialog-lite-css');

  if (settings) {
    const defaultSettings = config.container.get(DefaultDialogSettings);
    Object.assign(defaultSettings, settings);
  }
}

export * from './dialog-settings';
export * from './dialog-service';
export * from './dialog-controller';

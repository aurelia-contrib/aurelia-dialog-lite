# aurelia-dialog-lite ![CI](https://github.com/aurelia-contrib/aurelia-dialog-lite/workflows/CI/badge.svg)

A very lite Aurelia dialog plugin.

This project is a cut-off version of original [aurelia-dialog](https://github.com/aurelia/dialog), with added focus-trap from [Micromodal](https://github.com/ghosh/Micromodal).

## What's changed from original aurelia-dialog?

1. removed most of the features, simplified APIs (incompatible).
2. give users total control on CSS and layout.
3. properly trap focus, prevent users from using Tab and Enter to hit button/anchor on the background DOM behind the active dialog.

### Should I migrate to aurelia-dialog-lite?

There are breaking changes, if aurelia-dialog did not trouble you, don't migrate.

For users who absolutely need proper focus trap, or have strong need for the CSS customization, aurelia-dialog-lite is a good fit.

## Guide

* [Install and config](#install-and-config)
* [Simplified layout](#simplified-layout)
* [Basic usage](#basic-usage)
* [Customise settings](#customise-settings)
* [Advanced usage](#advanced-usage)
  * [Programmatically close a dialog](#programmatically-close-a-dialog)
  * [View only dialog](#view-only-dialog)
  * [Dialog with multiple view templates](#dialog-with-multiple-view-templates)
* [Recipes](#recipes)
  * [z-index](#z-index)
  * [Enter key](#enter-key)
  * [Position through CSS](#position-through-css)
  * [Transition and animation](#transition-and-animation)

## Install and config

```bash
npm i aurelia-dialog-lite
```
Or
```bash
yarn add aurelia-dialog-lite
```

In Aurelia app's `src/main.js` (or `src/main.ts`).

```js
aurelia.use.plugin(PLATFORM.moduleName('aurelia-dialog-lite'));
```

> Note `PLATFORM.moduleName()` wrapper is only needed for app built with webpack.

Optionally, you can modify the default dialog settings.

```js
aurelia.use.plugin(PLATFORM.moduleName('aurelia-dialog-lite'), {
  host: document.body,
  overlayClassName: 'dialog-lite-overlay',
  escDismiss: false,
  overlayDismiss: false
});
```
* **host** is the element where aurelia-dialog-lite appends all dialogs to. Default to HTML body.
* **overlayClassName** is the CSS class name for the overlay element. Default to `"dialog-lite-overlay"`. See [simplifed layout](#simplifed-layout) for more details.
* **escDismiss** allows for closing the dialog via the keyboard ESC key.
* **overlayDismiss** allows for closing the dialog via clicking the overlay element.

They are the only settings available in aurelia-dialog-lite.

## Simplified layout

Before getting into the code, it's better to understand how aurelia-dialog-lite renders the dialogs.

For a dialog with following HTML template:
```html
<template>
  <div class="my-dialog">
    ...
  </div>
</template>
```

aurelia-dialog-lite inserts following to the `host` element (default to HTML body) .

```html
<body>
  ...
  <!-- following is appended by aurelia-dialog-lite -->
  <div class="dialog-lite-overlay">
    <div class="my-dialog">
      ...
    </div>
  </div>
  <!-- additional dialog has its own overlay element -->
  <div class="dialog-lite-overlay">
    <div class="another-dialog">
      ...
    </div>
  </div>
</body>
```

Imaging aurelia-dialog-lite only changes the `<template>` in your dialog HTML template to `<div class="dialog-lite-overlay">`, then appends the whole thing to HTML body.

> Original aurelia-dialog creates lots of DOM layers above your actual dialog, making CSS customization quite difficult.

### Simplified CSS

The default CSS for the overlay element is quite simple. It covers the full screen, uses flex layout to centre the user dialog. The following is all of aurelia-dialog-lite's CSS (injected to HTML head automatically).

```css
.dialog-lite-overlay {
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
```

> Note not all browsers support flex layout. To support old browsers like IE11, override `.dialog-lite-overlay` in your local CSS.

aurelia-dialog-lite injects the above CSS piece onto the very beginning of the HTML head, so your local CSS will always override/patch the original.

**This is all that aurelia-dialog-lite does on the DOM.** Knowing your dialog DOM is simply wrapped by a `<div class="dialog-lite-overlay">`, you are responsible to position and style your dialog through local CSS.

> Original aurelia-dialog supports few custom elements: `<ux-dialog>`, `<ux-dialog-header>`, `<ux-dialog-body>`, `<ux-dialog-footer>`, and one custom attribute `attach-focus`. **They are all removed from aurelia-dialog-lite.**

## Basic usage

Inject `DialogService` to your view model.

> Following guide shows all code examples in ESNext. It's very similar in TypeScript. At the end of each section, all the runnable code demos have both ESNext and TypeScript versions.

```js
import {inject} from 'aurelia-framework';
import {DialogService} from 'aurelia-dialog-lite';

@inject(DialogService)
export class MyComponent {
  constructor(dialogService) {
    this.dialogService = dialogService;
  }
}
```

Then use `dialogService.open()` to show a dialog.
```js
import {TestDialog} from './test-dialog';
export class MyComponent {
  //...
  showTestDialog() {
    this.dialogService.open({
      viewModel: TestDialog,
      model: { title: 'Test dialog' }
    }).then(
      output => {
        // output is the dialog output, can be anything.
      },
      err => {
        // err is the cancellation error.
        // You can ignore it most of the time.
      }
    )
  }
}
```

Or use async/await
```js
async showTestDialog() {
  try {
    const output = await this.dialogService.open({
      viewModel: TestDialog,
      model: { title: 'Test dialog' }
    });
    // ...
  } catch (err) {
    // cancelled
  )
}
```


> Note different from original aurelia-dialog, we simply return dialog closePromise. It either resolves to an output, or rejects to an cancellation error which you can ignore most of the time.

* **viewModel** is the dialog implementation.
* **view** is the optional HTML template for the dialog. Only for non-default HTML template file, or view only dialog implementation. See [advanced usage](#advanced-usage) for more details.
* **model** is an optional model object which will be passed to `activate(model?: any)` lifecycle callback of the dialog.

### Implement a dialog

In dialog, inject `DialogController` so that you can call `controller.cancel()` or `controller.ok()` later.

```js
import {inject} from 'aurelia-framework';
import {DialogController} from 'aurelia-dialog-lite';

@inject(DialogController}
export class TestDialog {
  constructor(controller) {
    this.controller = controller;
  }

  // The model set by dialogService.open()
  activate(model) {
    this.title = model.title;
  }
}
```
```html
<template>
  <div class="my-dialog">
    <p>${title}</p>
    <button click.trigger="controller.cancel()">Cancel</button>
    <button click.trigger="controller.ok()">OK</button>
  </div>
</template>
```

* `controller.cancel(reason: string = 'cancelled')` supports an optional reason for the cancellation. Default to `"cancelled"`. You can get it out from the rejected `err.message` following `dialogService.open()`.
* `controller.ok(output?: any)` supports an optional output for the resolution. You get get it out from the resolved output following `dialogService.open()`.

| Demo | | |
| :-- | :-- | :-- |
| Baisc usage | [ESNext](https://gist.dumber.app/?gist=75c60c9c5e7ff201b103b49f14dabbe7&open=src%2Fapp.js&open=src%2Fapp.scss&open=src%2Ftest-dialog.js&open=src%2Ftest-dialog.html) | [TypeScript](https://gist.dumber.app/?gist=8e2f13d8e39798449bfbb879c5477837&open=src%2Fapp.ts&open=src%2Fapp.scss&open=src%2Ftest-dialog.ts&open=src%2Ftest-dialog.html) |

## Customise settings

On top of the global settings through `aurelia.use.plugin()`, there are two more places you can customise the settings per dialog.

### 1. in `dialogService.open()` and `dialogService.create()` (showing in next section: advanced usage).
```js
this.dialogService.open({
  viewModel: TestDialog,
  escDismiss: true
})
```
You can customise `host`, `overlayClassName`, `escDismiss`, and `overlayDismiss`. **All the options are customisable per dialog.**

### 2. in dialog implementation constructor
```js
export class TestDialog {
  constructor(controller) {
    this.controller = controller;
    this.controller.overlayDismiss = true;
  }
}
```

The injected dialog controller instance is unique per dialog. Customise the settings in constructor so that the later rendering will honour the changed settings.

Note the API is simplified from the original aurelia-dialig:

aurelia-dialog
```js
this.controller.settings.overlayDismiss = true;
```
aurelia-dialog-lite
```js
this.controller.overlayDismiss = true;
```

| Demo | dialogService.open | dialog constructor |
| :-- | :-- | :-- |
| Customise settings | [ESNext](https://gist.dumber.app/?gist=8a7b030335b599a1df4fbbd6d710e8d2&open=src%2Fapp.js) | [TypeScript](https://gist.dumber.app/?gist=426abe0d73c6daa0f5ae7541760260bd&open=src%2Ftest-dialog.ts) |

## Advanced usage

### Programmatically close a dialog

API `dialogService.create()` is similar to `dialogService.open()`, but it returns a promise that resolves to new dialog controller, so you can control the dialog from outside.

In fact, `dialogService.open()` is simply implemented through `dialogService.create()`.
```ts
public open(contextSettings: DialogContextSettings = {}): Promise<any> {
  return this.create(contextSettings).then(
    dialogController => dialogController.closePromise
  );
}
```

After you got the dialog controller from `dialogService.create()`, you can use `controller.ok(...)` or `controller.cancel()` to close the dialog based on what happened outside of the dialog (e.g. a remote update).

```js
this.dialogService.create({...})
  .then(controller => {
    // you can later call controller.ok(...) or controller.cancel()
    // to close the dialog from outside.
  }
```
Or async/await
```js
const controller = await this.dialogService.create({...});
// ...
```

Following demo shows how to use dialog controller to close the dialog from outside. It also demonstrate native bootstrap modal layout inside aurelia-dialog-lite.

Note technically the delayed closure can be implemented in the dialog class itself. We only use delayed closure as a simple example of controlling dialog from outside.

| Demo | | |
| :-- | :-- | :-- |
| Programmatically close dialog | [ESNext](https://gist.dumber.app/?gist=1f04458dda868ab50e367f9ba8f7690e&open=src%2Fapp.js&open=src%2Fapp.html&open=src%2Fconfirm-dialog.js&open=src%2Fconfirm-dialog.html) | [TypeScript](https://gist.dumber.app/?gist=9739b6908b60770dd001d22aeb9f3bf5&open=src%2Fapp.ts&open=src%2Fapp.html&open=src%2Fconfirm-dialog.ts&open=src%2Fconfirm-dialog.html) |

### View only dialog
| Demo | | |
| :-- | :-- | :-- |
| View-only dialog | [ESNext](https://gist.dumber.app/?gist=e203e63f03beedd936b8f453404bc8d3&open=src%2Ftest-dialog.html&open=src%2Fapp.js) | [TypeScript](https://gist.dumber.app/?gist=9aa5c5362209f8f71faa4fb0237e1002&open=src%2Ftest-dialog.html&open=src%2Fapp.ts) |

### Dialog with multiple view templates

### dialogSerivce.hasActiveDialog, dialogSerivce.controllers, dialogSerivce.cancelAll()

DialogService exposes the controllers of the active dialogs through `dialogSerivce.controllers`, you can manually call `ok()` or `cancel()` on one or more of the controllers. It also exposes a simple boolean flag `dialogSerivce.hasActiveDialog` which is only `true` when there is at least one active dialog.

`dialogSerivce.cancelAll()` is a convenient method to cancel all active dialogs. It returns a promise to be resolved after all dialogs were cancelled.

> `dialogSerivce.cancelAll()` replaced aurelia-dialog's original `dialogSerivce.closeAll()`.

## Recipes

### z-index

aurelia-dialog-lite does not provide an option to set starting z-index. Just put an z-index in your CSS directly. For example set to 1040 as same as boostrap's modal backdrop.

```css
.dialog-lite-overlay {
  z-index: 1040;
  /* if you have a customised bootstrap scss
  z-index: $zindex-modal-backdrop;
  */
}
```

### Enter key
TODO Enter key with aurelia-combo, why we removed the feature from aurelia-dialog-lite due to edge cases.

### Position through CSS
TODO position dialog through CSS

TODO position dialog in IE11 compatible CSS

### Transition and animation
TODO css transition and animation

## License

MIT.

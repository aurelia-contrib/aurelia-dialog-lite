# aurelia-dialog-lite

This project is a cut-off version of original [aurelia-dialog](https://github.com/aurelia/dialog), with added focus-trap from [Micromodal](https://github.com/ghosh/Micromodal).

## License

MIT.

------

For a full documentation, read https://3cp.github.io/aurelia-dialog-lite

## For existing aurelia-dialog users

### What's changed from original aurelia-dialog?

1. removed lots of features, simplified APIs (incompatible).
2. give users total control on CSS and layout.
3. properly trap focus, prevent users from using Tab and Enter to hit button/anchor on the background DOM behind the active dialog.

### Should I migrate to aurelia-dialog-lite?

If aurelia-dialog did not trouble you. Don't migrate.

You might want to give aurelia-dialog-lite a try because of the above listed changes, especially for the CSS and layout.

### Simplified CSS and layout

When showing a dialog with


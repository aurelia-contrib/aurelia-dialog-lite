import {Aurelia} from 'aurelia-framework';

export function configure(aurelia: Aurelia) {
  // Load local plugin from ../src
  aurelia.use.feature('../src');
  aurelia.use.standardConfiguration();
  aurelia.use.developmentLogging('info');
  aurelia.use.plugin('aurelia-testing');

  aurelia.start().then(() => aurelia.setRoot());
}

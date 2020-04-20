import {StageComponent} from 'aurelia-testing';
import {bootstrap} from 'aurelia-bootstrapper';
import test from 'tape';

test('should render message', t => {
  let model = {message: 'from me'};
  let component = StageComponent
      .withResources('elements/hello-world')
      .inView('<hello-world message.bind="message"></hello-world>')
      .boundTo(model);

  component.create(bootstrap)
  .then(
    () => {
      const view = component.element;
      t.equal(view.textContent.trim(), 'Hello world from me');
    },
    e => {
      t.fail(e);
    }
  )
  .then(() => {
    if (component) {
      component.dispose();
      component = null;
    }
    t.end();
  });
});

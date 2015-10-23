
import { renderToString as render } from 'react-dom/server';

export default function renderToString(element, store, count = 5) {
  console.log('render ', count);

  const markup = render(element);

  return Promise.all(store.renderStore.getState().promises).then(actions => {
    // TODO: Reset the list of promises.
    // TODO: Check action payloads for redirects and errors.

    if (!actions.length || --count === 0 ) {
      const status = 200;
      const state = store.getState();
      return { markup, state, status };
    }

    return this.renderToString(element, count)
  });
}

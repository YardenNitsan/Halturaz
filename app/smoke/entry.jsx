import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App.jsx';
import { StoreProvider } from '../src/store.jsx';

export function render(path) {
  return renderToString(
    <MemoryRouter initialEntries={[path]}>
      <StoreProvider initialLocale="en">
        <App />
      </StoreProvider>
    </MemoryRouter>
  );
}

export { reducer } from '../src/store.jsx';

import { createApiMiddleware } from './server/handlers.js';

export function apiPlugin() {
  return {
    name: 'halturaz-api',
    configureServer(server) {
      server.middlewares.use(createApiMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(createApiMiddleware());
    }
  };
}

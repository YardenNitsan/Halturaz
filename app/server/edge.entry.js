/* The deployed function's first line. Bundled into
   supabase/functions/import/index.ts by `npm run fn:build`. */
import { handleRequest } from './edge.js';

Deno.serve(handleRequest);

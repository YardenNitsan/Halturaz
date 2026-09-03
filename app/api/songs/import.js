/* The chart importer as a Vercel function, on the same origin as the site.
   Everything it does lives in server/edge.js — the same handler the Supabase
   deploy wraps, and the same importChords the Vite middleware calls in dev. */
export const config = { runtime: 'edge' };

export { handleRequest as default } from '../../server/edge.js';

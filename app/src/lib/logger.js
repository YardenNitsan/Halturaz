/** Dev-oriented namespaced logging. Enable with localStorage or env — see createLogger. */

const isServer = typeof window === 'undefined';

/* Deno's edge runtime is 'server' by this test but need not carry `process`,
   so every read of it goes through here. */
const envVar = (name) => {
  try {
    return process.env[name];
  } catch {
    return undefined;
  }
};

function readConfig() {
  if (isServer) return envVar('HALTURAZ_DEBUG') || '';
  try {
    return localStorage.getItem('halturaz.debug') || '';
  } catch {
    return '';
  }
}

function isDev() {
  if (isServer) return envVar('NODE_ENV') !== 'production';
  try {
    return !!import.meta.env?.DEV;
  } catch {
    return false;
  }
}

let enabled = null;

function resolveEnabled() {
  const raw = readConfig().trim();
  if (raw === '0' || raw === 'false') return null;
  if (!raw) return isDev() ? '*' : null;
  if (raw === '1' || raw === '*' || raw === 'all') return '*';
  return new Set(raw.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean));
}

function nsOn(ns) {
  if (enabled === null) enabled = resolveEnabled();
  if (!enabled) return false;
  if (enabled === '*') return true;
  return enabled.has(ns);
}

function fmt(data) {
  if (data === undefined) return '';
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

export function refreshLogConfig() {
  enabled = null;
}

/** @param {string} namespace e.g. import, tab4u, store */
export function createLogger(namespace) {
  const tag = `[halturaz:${namespace}]`;

  function emit(level, msg, data) {
    if (!nsOn(namespace)) return;
    const line = data === undefined ? `${tag} ${msg}` : `${tag} ${msg}\n${fmt(data)}`;
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  }

  return {
    debug: (msg, data) => emit('debug', msg, data),
    info: (msg, data) => emit('info', msg, data),
    warn: (msg, data) => emit('warn', msg, data),
    error: (msg, data) => emit('error', msg, data),
    time(label) {
      const t0 = Date.now();
      return (msg, data) => emit('info', `${label}: ${msg} (+${Date.now() - t0}ms)`, data);
    }
  };
}

if (!isServer) {
  window.halturazLog = {
    enable(ns = '*') {
      localStorage.setItem('halturaz.debug', ns);
      refreshLogConfig();
      console.log(`[halturaz] logging enabled: ${ns}`);
    },
    disable() {
      localStorage.setItem('halturaz.debug', '0');
      refreshLogConfig();
      console.log('[halturaz] logging disabled');
    },
    status() {
      refreshLogConfig();
      console.log('[halturaz] debug config:', readConfig() || '(dev default)');
    }
  };
}

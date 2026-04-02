const PREFIX = '[B站优化]';
let debug = false;

export function setDebug(val) {
  debug = !!val;
}

export function log(...args) {
  if (debug) console.log(PREFIX, ...args);
}

export function warn(...args) {
  console.warn(PREFIX, ...args);
}

export function error(...args) {
  console.error(PREFIX, ...args);
}

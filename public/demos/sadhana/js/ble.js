/**
 * Compatibility shim. New code should import from `wearables.js`; keeping
 * this re-export avoids breaking any existing installation hooks.
 */
export * from './wearables.js';
export { WearableHub as BleSensor } from './wearables.js';

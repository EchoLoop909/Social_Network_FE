// Simple CustomEvent-based event bus
export const on = (name, handler) => {
  window.addEventListener(name, handler);
};
export const off = (name, handler) => {
  window.removeEventListener(name, handler);
};
export const emit = (name, detail) => {
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

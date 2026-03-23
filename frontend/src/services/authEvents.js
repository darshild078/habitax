// Simple callback registry for auth events (logout on 401)
// This avoids needing a navigation library — App.js registers a callback,
// api.js calls it when a 401 is received.

let _onUnauthorized = null;

export const registerUnauthorizedHandler = (fn) => {
  _onUnauthorized = fn;
};

export const triggerUnauthorized = () => {
  if (_onUnauthorized) _onUnauthorized();
};

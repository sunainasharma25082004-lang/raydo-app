/**
 * Web polyfill for React Native's codegenNativeCommands.
 */
function codegenNativeCommands(_config) {
  return new Proxy(
    {},
    {
      get: () => () => {
        /* no-op command on web */
      },
    }
  );
}

module.exports = codegenNativeCommands;
module.exports.default = codegenNativeCommands;

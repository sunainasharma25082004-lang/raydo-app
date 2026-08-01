/**
 * Web polyfill for React Native's codegenNativeComponent.
 * Returns an unimplemented view host component so Fabric specs can load on web.
 */
const UnimplementedView = require('react-native-web/dist/cjs/modules/UnimplementedView')
  .default;

function codegenNativeComponent(_componentName, _options) {
  return UnimplementedView;
}

module.exports = codegenNativeComponent;
module.exports.default = codegenNativeComponent;

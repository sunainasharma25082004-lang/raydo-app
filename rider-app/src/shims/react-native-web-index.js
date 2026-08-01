/**
 * react-native-web entry with Fabric codegen shims.
 *
 * Native libraries import { codegenNativeComponent } from 'react-native',
 * which Metro rewrites to react-native-web/dist/index. RNW does not export
 * those helpers, so we re-export RNW and add no-op implementations.
 */
const RNW = require('react-native-web/dist/cjs/index.js');
const codegenNativeComponent = require('./codegenNativeComponent');
const codegenNativeCommands = require('./codegenNativeCommands');

module.exports = {
  ...RNW,
  codegenNativeComponent,
  codegenNativeCommands,
};

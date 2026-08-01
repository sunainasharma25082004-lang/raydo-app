/**
 * Patches react-native-web so Fabric libraries can import
 * codegenNativeComponent / codegenNativeCommands on web.
 *
 * Safe to re-run. Run after npm install (see package.json postinstall).
 */
const fs = require('fs');
const path = require('path');

const rnwRoot = path.join(__dirname, '..', 'node_modules', 'react-native-web', 'dist');

const helperEsm = `import UnimplementedView from './UnimplementedView';

export function codegenNativeComponent(_componentName, _options) {
  return UnimplementedView;
}

export function codegenNativeCommands(_config) {
  return {};
}
`;

const helperCjs = `"use strict";
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.codegenNativeComponent = codegenNativeComponent;
exports.codegenNativeCommands = codegenNativeCommands;
var _UnimplementedView = _interopRequireDefault(require("./UnimplementedView"));
function codegenNativeComponent(_componentName, _options) {
  return _UnimplementedView.default;
}
function codegenNativeCommands(_config) {
  return {};
}
`;

const esmMarker = 'Raydo web polyfill';
const esmExport = `
// --- Raydo web polyfill: Fabric codegen ---
export { codegenNativeComponent, codegenNativeCommands } from './modules/raydoCodegenPolyfill';
// --- end Raydo web polyfill ---
`;

const cjsExport = `
// --- Raydo web polyfill: Fabric codegen ---
var _raydoCodegenPolyfill = require("./modules/raydoCodegenPolyfill");
exports.codegenNativeComponent = _raydoCodegenPolyfill.codegenNativeComponent;
exports.codegenNativeCommands = _raydoCodegenPolyfill.codegenNativeCommands;
// --- end Raydo web polyfill ---
`;

function stripPolyfill(content) {
  return content.replace(
    /\r?\n\/\/ --- Raydo web polyfill:[\s\S]*?\/\/ --- end Raydo web polyfill ---\r?\n?/g,
    '\n'
  );
}

function patch() {
  if (!fs.existsSync(rnwRoot)) {
    console.warn('[patch-rnw-codegen] react-native-web not installed, skipping');
    return;
  }

  const esmHelper = path.join(rnwRoot, 'modules', 'raydoCodegenPolyfill.js');
  const cjsHelper = path.join(rnwRoot, 'cjs', 'modules', 'raydoCodegenPolyfill.js');
  fs.mkdirSync(path.dirname(esmHelper), { recursive: true });
  fs.mkdirSync(path.dirname(cjsHelper), { recursive: true });
  fs.writeFileSync(esmHelper, helperEsm);
  fs.writeFileSync(cjsHelper, helperCjs);

  const targets = [
    { file: path.join(rnwRoot, 'index.js'), append: esmExport },
    { file: path.join(rnwRoot, 'cjs', 'index.js'), append: cjsExport },
  ];

  for (const { file, append } of targets) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    content = stripPolyfill(content).trimEnd();
    if (!content.includes(esmMarker)) {
      content = `${content}\n${append}`;
    }
    fs.writeFileSync(file, content.endsWith('\n') ? content : `${content}\n`);
  }

  console.log('[patch-rnw-codegen] react-native-web codegen polyfill applied');
}

patch();

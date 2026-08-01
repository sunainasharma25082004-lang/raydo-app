const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const webPackageShims = {
  'react-native-maps': path.resolve(__dirname, 'src/shims/react-native-maps.web.tsx'),
  'react-native-maps-directions': path.resolve(
    __dirname,
    'src/shims/react-native-maps-directions.web.tsx'
  ),
};

const rnwIndexShim = path.resolve(__dirname, 'src/shims/react-native-web-index.js');
const codegenComponentShim = path.resolve(__dirname, 'src/shims/codegenNativeComponent.js');
const codegenCommandsShim = path.resolve(__dirname, 'src/shims/codegenNativeCommands.js');

const previousResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Expo Router static/SSR uses platform=web + environment=node.
  // Always shim native-only packages for those graph builds.
  const env = context.customResolverOptions?.environment;
  const isWebGraph = platform === 'web' || env === 'node';

  if (isWebGraph) {
    if (webPackageShims[moduleName]) {
      return { filePath: webPackageShims[moduleName], type: 'sourceFile' };
    }

    // Named imports of codegen* from 'react-native' resolve to RNW dist/index
    if (
      moduleName === 'react-native-web/dist/index' ||
      moduleName === 'react-native-web/dist/index.js'
    ) {
      return { filePath: rnwIndexShim, type: 'sourceFile' };
    }

    // Deep imports used by safe-area-context and similar
    if (
      moduleName === 'react-native/Libraries/Utilities/codegenNativeComponent' ||
      moduleName.endsWith('/Libraries/Utilities/codegenNativeComponent') ||
      moduleName.endsWith('/Libraries/Utilities/codegenNativeComponent.js')
    ) {
      return { filePath: codegenComponentShim, type: 'sourceFile' };
    }

    if (
      moduleName === 'react-native/Libraries/Utilities/codegenNativeCommands' ||
      moduleName.endsWith('/Libraries/Utilities/codegenNativeCommands') ||
      moduleName.endsWith('/Libraries/Utilities/codegenNativeCommands.js')
    ) {
      return { filePath: codegenCommandsShim, type: 'sourceFile' };
    }
  }

  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const mobileNodeModules = path.resolve(projectRoot, "node_modules");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Monorepo root hoists React 18 + older scheduler for Next.js. Metro must not mix
// those with React 19 + scheduler@0.26 under this app (invalid hooks / null dispatcher).

const previousResolveRequest = config.resolver.resolveRequest;

function resolveFromMobile(moduleName) {
  try {
    return {
      type: "sourceFile",
      // paths: [projectRoot] => resolve projectRoot/node_modules/<module>
      filePath: require.resolve(moduleName, { paths: [projectRoot] }),
    };
  } catch {
    return null;
  }
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "react" ||
    moduleName.startsWith("react/") ||
    moduleName === "scheduler" ||
    moduleName.startsWith("scheduler/")
  ) {
    const resolved = resolveFromMobile(moduleName);
    if (resolved) return resolved;
  }

  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: path.join(mobileNodeModules, "react"),
  scheduler: path.join(mobileNodeModules, "scheduler"),
};

module.exports = config;

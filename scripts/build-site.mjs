import path from "node:path";
import process from "node:process";
import { rollup } from "rollup";
import { loadConfigFile } from "rollup/loadConfigFile";

const { options, warnings } = await loadConfigFile(
  path.resolve("rollup.config.js"),
  {
    bundleConfigAsCjs: true,
    environment: "INCLUDE_DEPS,BUILD:production",
  },
  false,
);

for (const inputOptions of options) {
  const bundle = await rollup(inputOptions);
  try {
    for (const outputOptions of inputOptions.output) {
      await bundle.write(outputOptions);
    }
  } finally {
    await bundle.close();
  }
}

warnings.flush();
process.exit(0);

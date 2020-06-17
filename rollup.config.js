import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default [
  {
    input: "src/index.js",
    output: {
      dir: "public/bundle/",
      format: "esm",
      name: "websearch",
    },
    plugins: [resolve(), commonjs(), json()],
  },
  {
    input: "src/process.js",
    output: {
      dir: "public/bundle/",
      format: "esm",
      name: "websearch",
    },
    plugins: [resolve(), commonjs(), json()],
  },
];

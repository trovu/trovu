import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

import scss from "rollup-plugin-scss";

export default [
  {
    input: "src/index.js",
    output: {
      dir: "public/bundle/",
      format: "esm",
      name: "websearch",
    },
    plugins: [
      resolve(),
      commonjs(),
      json(),
      scss({
        watch: "src/css",
        output: "public/bundle/style.css",
      }),
    ],
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

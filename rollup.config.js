import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import scss from "rollup-plugin-scss";

export default [
  {
    input: "src/js/index.js",
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
        output: "public/bundle/style.css",
      }),
    ],
  },
  {
    input: "src/js/process.js",
    output: {
      dir: "public/bundle/",
      format: "esm",
      name: "websearch",
    },
    plugins: [resolve(), commonjs(), json()],
  },
];

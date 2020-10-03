import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

import css from 'rollup-plugin-css-only'


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
      css({
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

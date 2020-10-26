import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import scss from "rollup-plugin-scss";
import { terser } from "rollup-plugin-terser";

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
      process.env.BUILD === "production" && terser(),
    ],
  },
  {
    input: "src/js/process.js",
    output: {
      dir: "public/bundle/",
      format: "esm",
      name: "websearch",
    },
    plugins: [
      resolve(),
      commonjs(),
      json(),
      process.env.BUILD === "production" && terser(),
    ],
  },
];

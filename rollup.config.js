import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import scss from "rollup-plugin-scss";
import { terser } from "rollup-plugin-terser";

const common = {
  output: {
    dir: "public/bundle/",
    format: "iife",
    name: "index",
    //entryFileNames: "[name].[hash].js",
    entryFileNames: "[name].js",
    sourcemap: true,
  },
  plugins: [
    resolve(),
    commonjs(),
    json(),
    scss({
      output: "public/bundle/style.css",
      outputStyle: process.env.BUILD === "production" ? "compressed" : "",
    }),
    process.env.BUILD === "production" && terser(),
  ],
};

export default [
  {
    input: "src/js/index.js",
    ...common,
  },
  {
    input: "src/js/process.js",
    ...common,
  },
];

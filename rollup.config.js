import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import scss from "rollup-plugin-scss";
import { terser } from "rollup-plugin-terser";
import html from "@rollup/plugin-html";
import { readFileSync } from "fs";
import copy from "rollup-plugin-copy";

const isProduction = process.env.BUILD === "production";

const output = {
  dir: "dist/public/",
  name: "process",
  entryFileNames: "[name].[hash].js",
  sourcemap: true,
};

const template = (templateFilePath) => {
  const templateFunc = ({ attributes, bundle, files, publicPath, title }) => {
    const [fileNameJs] = Object.keys(bundle);
    const htmlTemplate = readFileSync(templateFilePath).toString();
    const html = htmlTemplate.replace("{{fileNameJs}}", fileNameJs);
    return html;
  };
  return templateFunc;
};

export default [
  {
    input: "src/js/index.js",
    output: output,
    plugins: [
      resolve(),
      commonjs(),
      json(),
      scss({
        output: "dist/public/style.css",
        outputStyle: isProduction ? "compressed" : "expanded",
      }),
      isProduction && terser(),
      html({
        fileName: "index.html",
        template: template("src/html/index.html"),
      }),
      copy({
        targets: [{ src: "src/opensearch/", dest: "dist/public/" }],
      }),
    ],
  },
  {
    input: "src/js/process.js",
    output: output,
    plugins: [
      resolve(),
      commonjs(),
      json(),
      isProduction && terser(),
      html({
        fileName: "process/index.html",
        template: template("src/html/process.html"),
      }),
    ],
  },
];

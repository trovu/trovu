import commonjs from "@rollup/plugin-commonjs";
import html from "@rollup/plugin-html";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import { readFileSync } from "fs";
import copy from "rollup-plugin-copy";
import execute from "rollup-plugin-execute";
import gitInfo from "rollup-plugin-git-info";
import scss from "rollup-plugin-scss";
import { terser } from "rollup-plugin-terser";
import watch from "rollup-plugin-watch";

const isProduction = process.env.BUILD === "production";

const output = {
  dir: "dist/public/",
  name: "process",
  entryFileNames: "[name].js",
  sourcemap: true,
  format: "es",
};

const template = (templateFilePath) => {
  const templateFunc = ({ attributes, bundle, files, publicPath, title }) => {
    const [fileNameJs] = Object.keys(bundle);
    const htmlTemplate = readFileSync(templateFilePath).toString();
    const currentTimestamp = new Date().toISOString();
    const html = htmlTemplate
      .replace(/{{fileNameJs}}/g, `${fileNameJs}`)
      .replace(/{{currentTimestamp}}/g, `${currentTimestamp}`);
    return html;
  };
  return templateFunc;
};

export default [
  {
    input: "src/js/index.js",
    output: output,
    external: ["node-fetch"], // Only needed for Raycast
    plugins: [
      watch({ dir: "src/html/" }),
      watch({ dir: "src/img/" }),
      watch({ dir: "data/" }),
      resolve(),
      commonjs(),
      gitInfo(), // includes also json()
      scss({
        output: "dist/public/style.css",
        outputStyle: isProduction ? "compressed" : "expanded",
      }),
      execute("npm run compile-data"),
      isProduction && terser(),
      html({
        fileName: "index.html",
        template: template("src/html/index.html"),
      }),
      copy({
        targets: [
          {
            src: "src/favicon/*.{ico,png,svg,xml}",
            dest: "dist/public/",
          },
          { src: "src/img/*", dest: "dist/public/img/" },
          {
            src: "src/js/userscripts/*.user.js",
            dest: "dist/public/userscripts/",
          },
          { src: "src/opensearch/", dest: "dist/public/" },
          { src: "node_modules/font-awesome/fonts/", dest: "dist/public/" },
          { src: "src/js/pwa/*", dest: "dist/public/" },
          { src: "src/manifest/*", dest: "dist/public/" },
          { src: "src/json/assetlinks.json", dest: "dist/public/.well-known/" },
        ],
      }),
    ],
  },
  {
    input: "src/js/process.js",
    output: output,
    external: ["node-fetch"], // Only needed for Raycast
    plugins: [
      resolve(),
      commonjs(),
      gitInfo(), // includes also json()
      isProduction && terser(),
      html({
        fileName: "process/index.html",
        template: template("src/html/process.html"),
      }),
    ],
  },
];

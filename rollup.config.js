import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import scss from "rollup-plugin-scss";
import { terser } from "rollup-plugin-terser";
import html from "@rollup/plugin-html";
import { readFileSync } from "fs";

const isProduction = process.env.BUILD === "production";

export default [ {
  input: "src/js/process.js",
  output: {
    dir: "dist/public/",
    name: "process",
    entryFileNames: "[name].[hash].js",
    sourcemap: true,
  },
  plugins: [
    resolve(),
    commonjs(),
    json(),
    scss({
      output: "dist/public/style.css",
      outputStyle: isProduction ? "compressed" : "",
    }),
    isProduction && terser(),
    html({
      fileName: "process/index.html",
      template: ({ attributes, bundle, files, publicPath, title }) => {
        //console.log('files:', files);
        console.log(Object.keys(bundle));
        //console.log('template process');
        const [processJs] = Object.keys(bundle);
        const fileNames = Object.keys(bundle);
        const htmlTemplate = readFileSync("src/html/process.html").toString();
        const html = htmlTemplate.replace("{{processJs}}", processJs);
        return html;
      },
    })
  ],
},{
  input: "src/js/index.js",
  output: {
    dir: "dist/public/",
    name: "process",
    entryFileNames: "[name].[hash].js",
    sourcemap: true,
  },
  plugins: [
    resolve(),
    commonjs(),
    json(),
    scss({
      output: "dist/public/style.css",
      outputStyle: isProduction ? "compressed" : "",
    }),
    isProduction && terser(),
    html({
      fileName: "index.html",
      template: ({ attributes, bundle, files, publicPath, title }) => {
        //console.log('files:', files);
        console.log(Object.keys(bundle));
        //console.log('template process');
        const [indexJs] = Object.keys(bundle);
        const fileNames = Object.keys(bundle);
        const htmlTemplate = readFileSync("src/html/index.html").toString();
        const html = htmlTemplate.replace("{{indexJs}}", indexJs);
        return html;
      },
    })
  ],
}];

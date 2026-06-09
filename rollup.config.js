import DataCompiler from "./src/ts/modules/DataCompiler.ts";
import commonjs from "@rollup/plugin-commonjs";
import html from "@rollup/plugin-html";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import fs from "fs";
import path from "path";
import scss from "rollup-plugin-scss";

const isProduction = process.env.BUILD === "production";

const output = {
  dir: "dist/public/",
  name: "process",
  entryFileNames: "[name].js",
  sourcemap: true,
  format: "es",
};

const gitInfo = DataCompiler.getGitInfo();

const copyDirectory = (src, dest) => {
  fs.cpSync(src, dest, {
    recursive: true,
    filter: (file) => path.basename(file) !== ".DS_Store",
  });
};

const copyStaticAssets = () => ({
  name: "copy-static-assets",
  writeBundle() {
    for (const [src, dest] of [
      ["src/img", "dist/public/img"],
      ["src/js/userscripts", "dist/public/userscripts"],
      ["src/opensearch", "dist/public/opensearch"],
      ["node_modules/@fortawesome/fontawesome-free/webfonts", "dist/public/webfonts"],
      ["src/js/pwa", "dist/public"],
      ["src/manifest", "dist/public"],
      ["schema", "dist/public/schema"],
    ]) {
      copyDirectory(src, dest);
    }

    for (const file of fs.readdirSync("src/favicon")) {
      if (/\.(ico|png|svg|xml)$/.test(file)) {
        fs.copyFileSync(path.join("src/favicon", file), path.join("dist/public", file));
      }
    }

    fs.mkdirSync("dist/public/.well-known", { recursive: true });
    fs.copyFileSync("src/json/assetlinks.json", "dist/public/.well-known/assetlinks.json");
    fs.copyFileSync("src/json/log.json", "dist/public/log.json");
  },
});

const watchTemplate = (templateFilePath) => ({
  name: "watch-template",
  generateBundle() {
    if (!this.meta.watchMode) {
      return;
    }
    this.addWatchFile(path.resolve(templateFilePath));
  },
});

const template = (templateFilePath) => {
  const templateFunc = ({ attributes, bundle, files, publicPath, title }) => {
    const [fileNameJs] = Object.keys(bundle);
    const config = DataCompiler.getConfig();
    const placeholders = {
      urlBlog: config.url.blog,
      urlDocs: config.url.docs,
      urlImpressum: config.url.impressum,
      fileNameJs: fileNameJs,
      currentTimestamp: new Date().toISOString(),
    };

    let html = fs.readFileSync(templateFilePath).toString();

    Object.keys(placeholders).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      html = html.replace(regex, placeholders[key]);
    });

    return html;
  };
  return templateFunc;
};

export default [
  {
    input: "src/ts/cli.ts",
    output: {
      file: "dist/cli.mjs",
      format: "esm",
      sourcemap: true,
    },
    external: [
      "commander",
      "fs",
      "child_process",
      "js-yaml",
      "ajv",
      "countries-list",
      "split-limit",
      "dayjs",
      "escape-string-regexp",
    ],
    plugins: [
      typescript(), // Use the TypeScript plugin
    ],
  },
  {
    input: "src/ts/index.ts",
    output: output,
    plugins: [
      watchTemplate("src/html/index.html"),
      resolve(),
      commonjs(),
      json(),
      scss({
        fileName: "style.css",
        outputStyle: isProduction ? "compressed" : "expanded",
      }),
      isProduction && terser(),
      html({
        fileName: "index.html",
        template: template("src/html/index.html"),
      }),
      replace({
        preventAssignment: true,
        GIT_INFO: JSON.stringify(gitInfo),
      }),
      copyStaticAssets(),
      typescript(), // Add the TypeScript plugin here
    ],
  },
  {
    input: "src/ts/process.ts",
    output: output,
    plugins: [
      watchTemplate("src/html/process.html"),
      resolve(),
      commonjs(),
      json(),
      isProduction && terser(),
      html({
        fileName: "process/index.html",
        template: template("src/html/process.html"),
      }),
      replace({
        preventAssignment: true,
        GIT_INFO: JSON.stringify(gitInfo),
      }),
      typescript(), // Add the TypeScript plugin here
    ],
  },
];

const _ = require("lodash");
const fs = require("fs");
const cp = require("child_process");
const sct = require("source-code-tokenizer");
const debug = require("debug")("complexity-js");
const assert = require("assert");

// all languages supported by guesslang package
// can be obtained by executing "npx nopenv guesslang -l"
// make sure extensions match the list in tokenizer package:
// https://github.com/devreplay/source-code-tokenizer/blob/master/src/extensionmap.ts
const extensions = {
  ".bat": "Batchfile",
  ".c": "C",
  ".cs": "C#",
  ".cpp": "C++",
  ".coffee": "CoffeeScript",
  ".css": "CSS",
  ".er": "Erlang",
  ".go": "Go",
  ".hs": "Haskell",
  ".html": "HTML",
  ".java": "Java",
  ".js": "JavaScript",
  ".ipynb": "Jupyter Notebook",
  ".lua": "Lua",
  ".md": "Markdown",
  ".mat": "Matlab",
  ".m": "Objective-C",
  ".perl": "Perl",
  ".php": "PHP",
  ".ps": "PowerShell",
  ".py": "Python",
  ".r": "R",
  ".ruby": "Ruby",
  ".rs": "Rust",
  ".sc": "Scala",
  ".sh": "Shell",
  ".sql": "SQL",
  ".swift": "Swift",
  ".tex": "TeX",
  ".ts": "TypeScript",
};

async function guessFileSource(src = "") {
  const work = new Promise((resolve, reject) => {
    debug("executing python through nopy to guess language");
    const proc = cp.exec("npx nopenv guesslang", (err, stdout, stderr) => {
      if (err) {
        debug("guesslang encountered an error: %o stderr: %s", err, stderr);
        reject(err);
      }
      debug("guesslang stdout: %s", stdout);
      const language = stdout
        .trim()
        .replace("Programming language: ", "")
        .toLowerCase();
      debug("guesslang language: %s", language);
      const extension = _.findKey(
        extensions,
        (lang) => lang.toLowerCase() === language
      );
      debug("guesslang extension: %s", extension);
      resolve(`source${extension}`);
    });
    debug("writing the source to stdin: %s", src);
    proc.stdin.write(src);
    debug("closing the stdin");
    proc.stdin.end();
  });
  const source = await work;
  return source;
}

async function tokenize(args = { source: "", file: "", ext: "" }) {
  assert.ok(args.file || args.source, "provide a file path OR source code");
  assert.ok(!(args.file && args.source), "remove either file OR source code");
  let src = "",
    ext = args.ext ? `source${args.ext}` : "";
  if (args.file) {
    src = await fs.promises.readFile(args.file, { encoding: "utf-8" });
    if (!ext) {
      ext = sct.getFileSource(args.file);
      ext = ext ? ext : await guessFileSource(src);
    }
  }
  if (args.source) {
    src = args.source;
    if (!ext) {
      ext = await guessFileSource(src);
    }
  }
  const { tokens } = await sct.tokenize(src, ext);
  return tokens;
}

async function main() {
  const tokens = await tokenize({ file: "index.js" });
  debugger;
}

main();

#!/usr/bin/env node

const _ = require("lodash");
const fs = require("fs");
const cp = require("child_process");
const sct = require("source-code-tokenizer");
const debug = require("debug")("complexity-js");
const assert = require("assert");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const argv = yargs(hideBin(process.argv)).argv;

// all languages supported by guesslang package
// can be obtained by executing "npx nopenv guesslang -l"
// make sure extensions match the list in tokenizer package:
// https://github.com/devreplay/source-code-tokenizer/blob/master/src/extensionmap.ts
const EXTENSIONS = {
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

const DEFAULT_ARGS = { source: "", file: "", grammar: "" };

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
        EXTENSIONS,
        (lang) => lang.toLowerCase() === language
      );
      debug("guesslang extension: %s", extension);
      const {
        grammarPaths,
      } = require("source-code-tokenizer/lib/extensionmap");
      const grammarPath = _.findKey(
        grammarPaths,
        (g) => _.first(g) === extension
      );
      resolve(grammarPath);
    });
    debug("writing the source to stdin: %s", src);
    proc.stdin.write(src);
    debug("closing the stdin");
    proc.stdin.end();
  });
  const source = await work;
  return source;
}

async function tokenize(args = DEFAULT_ARGS) {
  assert.ok(args.file || args.source, "provide a file path OR source code");
  assert.ok(!(args.file && args.source), "remove either file OR source code");
  let src = "",
    grammar = args.grammar ? `source${args.grammar}` : "";
  if (args.file) {
    src = await fs.promises.readFile(args.file, { encoding: "utf-8" });
    if (!grammar) {
      grammar = sct.getFileSource(args.file);
      grammar = grammar ? grammar : await guessFileSource(src);
    }
  }
  if (args.source) {
    src = args.source;
    if (!grammar) {
      grammar = await guessFileSource(src);
    }
  }
  const { tokens } = await sct.tokenize(src, grammar);
  return tokens;
}

async function extractOperators(args = DEFAULT_ARGS) {
  const tokens = await tokenize(args);
  const operators = tokens.filter(
    (token) =>
      token.scopes.filter((scope) => scope.includes("operator")).length > 0
  );
  return operators.map((op) => op.value);
}

async function main() {
  const operators = await extractOperators({
    file: argv.file || __filename,
  });
  const OTO = 1.54; // Operand to Operator constant

  const n1 = _.uniq(operators).length;
  const n2 = Math.floor(OTO * n1);
  const N1 = operators.length;
  const N2 = Math.floor(OTO * N1);

  const programVocabulary = n1 * n2;
  const programLength = n1 * n2;
  const calculatedProgramLength = n1 * Math.log2(n1) + n2 * Math.log2(n2);
  const volume = programLength * Math.log2(programVocabulary);
  const difficulty = (n1 / 2) * (N2 / n2);
  const effort = difficulty * volume;
  const timeToProgram = effort / 18;
  const deliveredBugs = volume / 3000;

  debug("n1: %s", n1);
  debug("n2: %s", n2);
  debug("N1: %s", N1);
  debug("N2: %s", N2);
  debug("vocabulary: %s", programVocabulary);
  debug("length: %s", programLength);
  debug("calculated_length: %s", calculatedProgramLength);
  debug("volume: %s", volume);
  debug("difficulty: %s", difficulty);
  debug("effort: %s", effort);
  debug("time: %s", timeToProgram);
  debug("bugs: %s", deliveredBugs);
}

main();

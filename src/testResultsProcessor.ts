import { writeFileSync } from "fs";
import { mkdirp } from "mkdirp";
import path from "path";

import { defaultOutputFile, defaultUserName } from "./constants.js";
import { generateTrx, IOptions } from "./trx-generator.js";
import { TestModule } from "vitest/node";

const processor = (
  options: IOptions = {
    outputFile: defaultOutputFile,
    defaultUserName,
  },
) => (testModules: TestModule[]): TestModule[] => {
  process.stdout.write("Generating TRX file...");

  const trx = generateTrx(testModules, options);

  const targetDir = path.dirname(path.resolve(options.outputFile));
  mkdirp.sync(targetDir);

  writeFileSync(options.outputFile, trx, { encoding: "utf8" });
  process.stdout.write("DONE\n");
  process.stdout.write(`TRX file output to '${options.outputFile}'\n`);

  // Return the input testRunResult to allow for chaining other result processors
  return testModules;
};

export default processor;

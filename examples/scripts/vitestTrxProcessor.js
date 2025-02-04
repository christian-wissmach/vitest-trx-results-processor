var builder = require("vitest-trx-results-processor/dist/testResultsProcessor");

var processor = builder({
  outputFile: "relative/path/to/resulting.trx", // this defaults to "test-results.trx"
});

module.exports = processor;

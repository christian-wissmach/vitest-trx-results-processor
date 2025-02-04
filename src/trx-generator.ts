import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { XMLElement, create as createXmlBuilder } from 'xmlbuilder';

import { SerializedError } from '@vitest/utils';
import { TestCase, TestModule, TestSuite } from 'vitest/node';
import { testListAllLoadedResultsId, testListNotInListId, testOutcomeTable, testType } from './constants';
import { formatDuration, getEnvInfo } from './utils';

/**
 * All the configuration options.
 */
export interface IOptions {
  /**
   * Path to the resulting TRX file.
   * @default "test-results.trx"
   */
  outputFile: string;

  /**
   * The username to use if the real username cannot be detected.
   * @default "anonymous"
   */
  defaultUserName?: string;

  /**
   * Set of methods that may be used to augment the resulting trx file.
   * Each of these methods are called after the testResultNode has been generated.
   */
  postProcessTestResult?: [(testSuiteResult: TestSuite, testResult: TestCase, testResultNode: XMLElement) => void];
}

const renderTestRun = (builder: XMLElement, testModule: TestModule, computerName: string, userName: string): void => {
  const startTime = testModule.children.tests().next().value?.diagnostic()?.startTime ?? 0;
  builder
      .att('id', uuidv4())
      .att('name', `${userName}@${computerName} ${new Date(startTime).toISOString()}`)
      .att('runUser', userName)
      .att('xmlns', 'http://microsoft.com/schemas/VisualStudio/TeamTest/2010');
};

const renderTestSettings = (parentNode: XMLElement): void => {
  parentNode.ele('TestSettings').att('name', 'Jest test run').att('id', uuidv4());
};

const renderTimes = (parentNode: XMLElement, testModules: TestModule[]): void => {
  const startTime = testModules[0].children.tests().next().value?.diagnostic()?.startTime ?? 0;
  let totalDuration = 0;
  for (const testModule of testModules) {
    totalDuration = totalDuration + testModule.diagnostic().duration;
  }
  const startDate = new Date(startTime).toISOString();
  const finishDate = new Date(startTime + totalDuration).toISOString();

  parentNode
      .ele('Times')
      .att('creation', startDate)
      .att('queuing', startDate)
      .att('start', startDate)
      .att('finish', finishDate);
};

const renderResultSummary = (parentNode: XMLElement, testModules: TestModule[]): void => {
  const failedTests = [];
  const passedTests = [];
  const pendingTests = [];
  const allTests = [];

  let errors: SerializedError[] = [];

  for (const testModule of testModules) {
    const tests = testModule.children.allTests();
    if (testModule.errors() && testModule.errors().length > 0) {
      errors = errors.concat(testModule.errors());
    }

    for (const test of tests) {
      if (test.result().state === 'failed') {
        failedTests.push(test);
      } else if (test.result().state === 'passed') {
        passedTests.push(test);
      } else if (test.result().state === 'pending' || test.result().state === 'skipped') {
        pendingTests.push(test);
      }
      allTests.push(test);
    }
  }
  

  const anyTestFailures = failedTests.length > 0;

  const isSuccess = !(anyTestFailures || errors.length > 0);

  const summary = parentNode.ele('ResultSummary').att('outcome', isSuccess ? 'Passed' : 'Failed');

  summary
      .ele('Counters')
      .att('total', allTests.length + errors.length)
      .att('executed', allTests.length - pendingTests.length)
      .att('passed', passedTests.length)
      .att('failed', failedTests.length)
      .att('error', errors.length);
};

const renderTestLists = (parentNode: XMLElement): void => {
  const testLists = parentNode.ele('TestLists');

  testLists.ele('TestList').att('name', 'Results Not in a List').att('id', testListNotInListId);

  testLists.ele('TestList').att('name', 'All Loaded Results').att('id', testListAllLoadedResultsId);
};

const renderTestSuiteResult = (
    testSuiteResult: TestSuite,
    testDefinitionsNode: XMLElement,
    testEntriesNode: XMLElement,
    resultsNode: XMLElement,
    computerName: string,
    postProcessTestResult?: [
      (
          // eslint-disable-next-line no-shadow
          testSuiteResult: TestSuite,
          testResult: TestCase,
          testResultNode: XMLElement,
      ) => void,
    ],
): void => {
  let runningDuration = 0;
  for (const testResult of testSuiteResult.children.tests()) {
    const testId = uuidv4();
    const executionId = uuidv4();
    const fullTestName = testResult.fullName;
    const filepath = path.relative('./', testResult.module.moduleId);
    const duration = testResult.diagnostic()?.duration || 0;

    // UnitTest
    const unitTest = testDefinitionsNode
        .ele('UnitTest')
        .att('name', fullTestName)
        .att('id', testId)
        .att('storage', filepath);
    unitTest.ele('Execution').att('id', executionId);
    unitTest
        .ele('TestMethod')
        .att('codeBase', filepath)
        .att('name', fullTestName)
        .att('className', testSuiteResult.fullName);

    // TestEntry
    testEntriesNode
        .ele('TestEntry')
        .att('testId', testId)
        .att('executionId', executionId)
        .att('testListId', testListNotInListId);

    const startTime = testSuiteResult.children.tests().next().value?.diagnostic()?.startTime ?? 0;
    // UnitTestResult
    const result = resultsNode
        .ele('UnitTestResult')
        .att('testId', testId)
        .att('executionId', executionId)
        .att('testName', fullTestName)
        .att('computerName', computerName)
        .att('duration', formatDuration(duration))
        .att('startTime', new Date(startTime).toISOString())
        .att('endTime', new Date(startTime + runningDuration).toISOString())
        .att('testType', testType)
        .att('outcome', testOutcomeTable[testResult.result().state])
        .att('testListId', testListNotInListId);

    runningDuration += duration;

    if (testResult.result().state === 'failed') {
      result.ele('Output').ele('ErrorInfo').ele('Message', testResult.result().errors?.map(e => e.message).join('\n'));
    }

    // Perform any post processing for this test result.
    if (postProcessTestResult) {
      postProcessTestResult.forEach(postProcess => postProcess(testSuiteResult, testResult, result));
    }
  }

  if (testSuiteResult.errors()?.length > 0) {
    // For suites that failed to run, we will generate a test result that documents the failure.
    // This occurs when there is a failure compiling/loading the suite or an assertion in a before/after hook fails,
    // not when a test in the suite fails.
    const testId = uuidv4();
    const executionId = uuidv4();
    const fullTestName = testSuiteResult.fullName;
    const time = new Date().toISOString();
    const filepath = path.relative('./', testSuiteResult.module.moduleId);

    // Failed TestSuite
    const unitTest = testDefinitionsNode
        .ele('UnitTest')
        .att('name', fullTestName)
        .att('id', testId)
        .att('storage', filepath);
    unitTest.ele('Execution').att('id', executionId);
    unitTest
        .ele('TestMethod')
        .att('codeBase', filepath)
        .att('name', fullTestName)
        .att('className', testSuiteResult.fullName);
    // TestEntry
    testEntriesNode
        .ele('TestEntry')
        .att('testId', testId)
        .att('executionId', executionId)
        .att('testListId', testListNotInListId);
    // UnitTestResult
    const result = resultsNode
        .ele('UnitTestResult')
        .att('testId', testId)
        .att('executionId', executionId)
        .att('testName', fullTestName)
        .att('computerName', computerName)
        .att('duration', '0')
        .att('startTime', time)
        .att('endTime', time)
        .att('testType', testType)
        .att('outcome', testOutcomeTable['failed'])
        .att('testListId', testListNotInListId);
    result.ele('Output').ele('ErrorInfo').ele('Message', testSuiteResult.errors().map(e => e.message).join('\n'));
  }
};

export const generateTrx = (testModules: TestModule[], options?: IOptions): string => {
  const { computerName, userName } = getEnvInfo(options && options.defaultUserName);

  const resultBuilder = createXmlBuilder('TestRun', {
    invalidCharReplacement: '',
    version: '1.0',
    encoding: 'UTF-8',
  });

  renderTestRun(resultBuilder, testModules[0], computerName, userName);

  renderTestSettings(resultBuilder);

  renderTimes(resultBuilder, testModules);

  renderResultSummary(resultBuilder, testModules);

  const testDefinitions = resultBuilder.ele('TestDefinitions');

  renderTestLists(resultBuilder);

  const testEntries = resultBuilder.ele('TestEntries');
  const results = resultBuilder.ele('Results');

  for (const testModule of testModules) {
    for (const testSuiteResult of testModule.children.allSuites()) {
      renderTestSuiteResult(
          testSuiteResult,
          testDefinitions,
          testEntries,
          results,
          computerName,
          options && options.postProcessTestResult,
      );
    }
  }

  return resultBuilder.end({ pretty: true });
};

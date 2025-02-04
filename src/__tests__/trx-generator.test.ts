import {generateTrx, IOptions} from "../trx-generator";
import {describe, expect, it} from 'vitest';
import {TestCase, TestModule, TestSuite} from "vitest/node";
import {XMLElement} from "xmlbuilder";
import xml2js = require("xml2js");

describe("trx-generator", (): void => {
    it("processes the results correctly", (): void => {

        const test1: TestCase = {
            module: {
                moduleId: "C:\\testPath\\test.js",
            },
            result: () => ({
                state: "passed"
            }),
            name: "works well",
            fullName: () => "foo's > bar method > works well",
            diagnostic: () => ({
                startTime: 1478771929,
                duration: 4100
            }),
        } as TestCase;

        const test2: TestCase = {
            module: {
                moduleId: "C:\\testPath\\test.js",
            },
            result: () => ({
                state: "failed",
                errors: [{
                    message: "This did not go as planned"
                }],
                location: {
                    column: 0,
                    line: 0,
                },
            }),
            name: "works not so well",
            fullName: () => "foo's > bar method > works not so well",
            diagnostic: () => ({
                startTime: (1478771929 + 4100),
                duration: 2900
            }),
        } as TestCase;

        const mockIterator = function () {
            let index = 0;
            const values = [test1, test2];

            return {
                next: function () {
                    if (index < values.length) {
                        return {value: values[index++], done: false};
                    } else {
                        return {value: undefined, done: true};
                    }
                }
            };
        };

        const module: TestModule = {
            moduleId: "C:\\testPath\\test.js",
            children: {
                allSuites: () => [testSuite],
                allTests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIterator
                }),
                tests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIterator
                }),
            },
            state: () => 'passed',
            ok: () => true,
            diagnostic: () => ({
                duration: (4100 + 2900)
            }),
            errors: () => []
        } as TestModule;

        const testSuite: TestSuite = {
            module: module,
            children: {
                allTests: () => [test1, test2],
                tests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIterator
                })
            },
            errors: () => []
        } as TestSuite;

        const result = generateTrx([module]);

        xml2js.parseString(result, (err, parsed) => {
            expect(err).toBeFalsy();
            expect(parsed).toBeTruthy();
            expect(parsed.TestRun).toBeTruthy();
            expect(parsed.TestRun.$).toBeTruthy();
            expect(parsed.TestRun.$.xmlns).toEqual(
                "http://microsoft.com/schemas/VisualStudio/TeamTest/2010",
            );
            expect(parsed.TestRun.Results).toBeTruthy();
            expect(parsed.TestRun.Results.length).toEqual(1);
            expect(parsed.TestRun.Results[0].UnitTestResult.length).toEqual(2);
            expect(parsed.TestRun.Results[0].UnitTestResult[0].$.outcome).toEqual(
                "Passed",
            );
            expect(parsed.TestRun.Results[0].UnitTestResult[0].$.duration).toEqual(
                "00:00:04.100",
            );
            expect(parsed.TestRun.Results[0].UnitTestResult[1].$.outcome).toEqual(
                "Failed",
            );
            expect(parsed.TestRun.Results[0].UnitTestResult[1].$.duration).toEqual(
                "00:00:02.900",
            );
        });
    });
    it("handles error message with invalid XML chars correctly", (): void => {

        const test1: TestCase = {
            module: {
                moduleId: "C:\\testPath\\test.js",
            },
            result: () => ({
                state: "passed"
            }),
            name: "works well",
            fullName: () => "foo's > bar method > works well",
            diagnostic: () => ({
                startTime: 1478771929,
                duration: 4100
            }),
        } as TestCase;

        const test2: TestCase = {
            module: {
                moduleId: "C:\\testPath\\test.js",
            },
            result: () => ({
                state: "failed",
                errors: [{
                    message: "This did not go as planned\uDFFF"
                }],
                location: {
                    column: 0,
                    line: 0,
                },
            }),
            name: "works not so well",
            fullName: () => "foo's > bar method > works not so well",
            diagnostic: () => ({
                startTime: (1478771929 + 4100),
                duration: 2900
            }),
        } as TestCase;

        const mockIterator = function () {
            let index = 0;
            const values = [test1, test2];

            return {
                next: function () {
                    if (index < values.length) {
                        return {value: values[index++], done: false};
                    } else {
                        return {value: undefined, done: true};
                    }
                }
            };
        };

        const module: TestModule = {
            moduleId: "C:\\testPath\\test.js",
            children: {
                allSuites: () => [testSuite],
                allTests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIterator
                }),
                tests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIterator
                }),
            },
            state: () => 'passed',
            ok: () => true,
            diagnostic: () => ({
                duration: (4100 + 2900)
            }),
            errors: () => []
        } as TestModule;

        const testSuite: TestSuite = {
            module: module,
            children: {
                allTests: () => [test1, test2],
                tests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIterator
                })
            },
            errors: () => []
        } as TestSuite;

        const result = generateTrx([module]);
        expect(result).toBeTruthy();
    });
    it("handles skipped test suites", (): void => {

        const test1: TestCase = {
            module: {
                moduleId: "C:\\Users\\Github\\test\\test.spec.js",
            },
            result: () => ({
                state: "pending"
            }),
            name: "first",
            fullName: () => "first",
            diagnostic: () => ({
                startTime: 1478771929,
                duration: 4100
            }),
        } as TestCase;

        const mockIterator = function () {
            let index = 0;
            const values = [test1];

            return {
                next: function () {
                    if (index < values.length) {
                        return {value: values[index++], done: false};
                    } else {
                        return {value: undefined, done: true};
                    }
                }
            };
        };

        const module: TestModule = {
            moduleId: "C:\\Users\\Github\\test\\test.spec.js",
            children: {
                allSuites: () => [testSuite],
                allTests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIterator
                }),
                tests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIterator
                }),
            },
            state: () => 'skipped',
            ok: () => true,
            diagnostic: () => ({
                duration: (4100 + 2900)
            }),
            errors: () => []
        } as TestModule;

        const testSuite: TestSuite = {
            module: module,
            children: {
                allTests: () => [test1],
                tests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIterator
                })
            },
            errors: () => []
        } as TestSuite;

        const result = generateTrx([module]);
        expect(result).toBeTruthy();
    });

    it("handles queued test suites", (): void => {
        const test1: TestCase = {
            module: {
                moduleId: "C:\\Users\\Github\\test\\test.spec.js",
            },
            result: () => ({
                state: "pending"
            }),
            name: "first",
            fullName: () => "first",
            diagnostic: () => ({
                startTime: 1478771929,
                duration: 4100
            }),
        } as TestCase;

        const mockIterator = function () {
            let index = 0;
            const values = [test1];

            return {
                next: function () {
                    if (index < values.length) {
                        return {value: values[index++], done: false};
                    } else {
                        return {value: undefined, done: true};
                    }
                }
            };
        };

        const module: TestModule = {
            moduleId: "C:\\Users\\Github\\test\\test.spec.js",
            children: {
                allSuites: () => [testSuite],
                allTests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIterator
                }),
                tests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIterator
                }),
            },
            state: () => 'queued',
            ok: () => true,
            diagnostic: () => ({
                duration: (4100 + 2900)
            }),
            errors: () => []
        } as TestModule;

        const testSuite: TestSuite = {
            module: module,
            children: {
                allTests: () => [test1],
                tests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIterator
                })
            },
            errors: () => []
        } as TestSuite;

        const result = generateTrx([module]);
        expect(result).toBeTruthy();
    });

    it("verify runtime suite failures", () => {
        const test1: TestCase = {
            module: {
                moduleId: "C:\\testPath\\test.js",
            },
            result: () => ({
                state: "passed"
            }),
            name: "works well",
            fullName: () => "foo's > bar method > works well",
            diagnostic: () => ({
                startTime: 1511376995923,
                duration: 181
            }),
        } as TestCase;

        const test2: TestCase = {
            module: {
                moduleId: "C:\\testPath\\test.js",
            },
            result: () => ({
                state: "pending",
                location: {
                    column: 0,
                    line: 0,
                },
            }),
            name: "works not so well",
            fullName: () => "foo's > bar method > works not so well",
            diagnostic: () => ({
                startTime: (1478771929 + 4100),
                duration: 2900
            }),
        } as TestCase;

        const mockIterator1 = function () {
            let index = 0;
            const values = [test1];

            return {
                next: function () {
                    if (index < values.length) {
                        return {value: values[index++], done: false};
                    } else {
                        return {value: undefined, done: true};
                    }
                }
            };
        };

        const mockIterator2 = function () {
            let index = 0;
            const values = [test2];

            return {
                next: function () {
                    if (index < values.length) {
                        return {value: values[index++], done: false};
                    } else {
                        return {value: undefined, done: true};
                    }
                }
            };
        };

        const mockIteratorAll = function () {
            let index = 0;
            const values = [test1, test2];

            return {
                next: function () {
                    if (index < values.length) {
                        return {value: values[index++], done: false};
                    } else {
                        return {value: undefined, done: true};
                    }
                }
            };
        };

        const module: TestModule = {
            moduleId: "C:\\testPath\\test.js",
            children: {
                allSuites: () => [testSuite1, testSuite2],
                allTests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIteratorAll
                }),
                tests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIteratorAll
                }),
            },
            state: () => 'failed',
            ok: () => true,
            diagnostic: () => ({
                duration: (4100 + 2900)
            }),
            errors: () => [{
                message: "Failed stack"
            }]
        } as TestModule;

        const testSuite1: TestSuite = {
            module: module,
            children: {
                allTests: () => [test1],
                tests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIterator1
                })
            },
            errors: () => []
        } as TestSuite;

        const testSuite2: TestSuite = {
            module: module,
            children: {
                allTests: () => [test2],
                tests: () => ({
                    next: () => test2,
                    [Symbol.iterator]: mockIterator2
                })
            },
            errors: () => [{
                message: "Failing stack"
            }]
        } as TestSuite;

        const result = generateTrx([module]);

        // Verify the summary has the proper test counts.
        xml2js.parseString(result, (err, parsed) => {
            expect(err).toBeFalsy();
            expect(parsed).toBeTruthy();
            expect(parsed.TestRun).toBeTruthy();
            expect(parsed.TestRun.$).toBeTruthy();
            expect(parsed.TestRun.$.xmlns).toEqual(
                "http://microsoft.com/schemas/VisualStudio/TeamTest/2010",
            );
            expect(parsed.TestRun.Results).toBeTruthy();
            expect(parsed.TestRun.Results.length).toEqual(1);
            expect(parsed.TestRun.Results[0].UnitTestResult.length).toEqual(3);

            // Verify the summary values.
            expect(parsed.TestRun.ResultSummary[0].$.outcome).toBe("Failed");
            expect(parsed.TestRun.ResultSummary[0].Counters[0].$.total).toBe("3");
            expect(parsed.TestRun.ResultSummary[0].Counters[0].$.executed).toBe("1");
            expect(parsed.TestRun.ResultSummary[0].Counters[0].$.passed).toBe("1");
            expect(parsed.TestRun.ResultSummary[0].Counters[0].$.failed).toBe("0");
            expect(parsed.TestRun.ResultSummary[0].Counters[0].$.error).toBe("1");

            // First test passed
            expect(parsed.TestRun.Results[0].UnitTestResult[0].$.outcome).toEqual(
                "Passed",
            );
            expect(parsed.TestRun.Results[0].UnitTestResult[0].$.duration).toEqual(
                "00:00:00.181",
            );

            // Last test result represents the failed suite.
            expect(parsed.TestRun.Results[0].UnitTestResult[2].$.outcome).toEqual(
                "Failed",
            );
            expect(parsed.TestRun.Results[0].UnitTestResult[2].$.duration).toEqual(
                "0",
            );
            expect(
                parsed.TestRun.Results[0].UnitTestResult[2].Output[0].ErrorInfo[0]
                    .Message[0],
            ).toEqual("Failing stack");
        });
    });

    it("verify runtime suite failures with passing tests", () => {
        const test1: TestCase = {
            module: {
                moduleId: "C:\\testPath\\test.js",
            },
            result: () => ({
                state: "passed"
            }),
            name: "works well",
            fullName: () => "foo's > bar method > works well",
            diagnostic: () => ({
                startTime: 1511376995923,
                duration: 181
            }),
        } as TestCase;

        const mockIterator = function () {
            let index = 0;
            const values = [test1];

            return {
                next: function () {
                    if (index < values.length) {
                        return {value: values[index++], done: false};
                    } else {
                        return {value: undefined, done: true};
                    }
                }
            };
        };

        const module: TestModule = {
            moduleId: "C:\\testPath\\test.js",
            children: {
                allSuites: () => [testSuite],
                allTests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIterator
                }),
                tests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIterator
                }),
            },
            state: () => 'failed',
            ok: () => true,
            diagnostic: () => ({
                duration: (4100 + 2900)
            }),
            errors: () => [{
                message: "Failed stack"
            }]
        } as TestModule;

        const testSuite: TestSuite = {
            module: module,
            children: {
                allTests: () => [test1],
                tests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIterator
                })
            },
            errors: () => [{
                message: "Failing stack"
            }]
        } as TestSuite;

        const result = generateTrx([module]);

        // Verify the summary has the proper test counts.
        xml2js.parseString(result, (err, parsed) => {
            expect(err).toBeFalsy();
            expect(parsed).toBeTruthy();
            expect(parsed.TestRun).toBeTruthy();
            expect(parsed.TestRun.$).toBeTruthy();
            expect(parsed.TestRun.$.xmlns).toEqual(
                "http://microsoft.com/schemas/VisualStudio/TeamTest/2010",
            );
            expect(parsed.TestRun.Results).toBeTruthy();
            expect(parsed.TestRun.Results.length).toEqual(1);
            expect(parsed.TestRun.Results[0].UnitTestResult.length).toEqual(2);
            expect(parsed.TestRun.Results[0].UnitTestResult.length).toEqual(2);

            // Verify the summary values.
            expect(parsed.TestRun.ResultSummary[0].$.outcome).toBe("Failed");
            expect(parsed.TestRun.ResultSummary[0].Counters[0].$.total).toBe("2");
            expect(parsed.TestRun.ResultSummary[0].Counters[0].$.executed).toBe("1");
            expect(parsed.TestRun.ResultSummary[0].Counters[0].$.passed).toBe("1");
            expect(parsed.TestRun.ResultSummary[0].Counters[0].$.failed).toBe("0");
            expect(parsed.TestRun.ResultSummary[0].Counters[0].$.error).toBe("1");

            // First test passed
            expect(parsed.TestRun.Results[0].UnitTestResult[0].$.outcome).toEqual(
                "Passed",
            );
            expect(parsed.TestRun.Results[0].UnitTestResult[0].$.duration).toEqual(
                "00:00:00.181",
            );

            // Second test result represents the failed suite.
            expect(parsed.TestRun.Results[0].UnitTestResult[1].$.outcome).toEqual(
                "Failed",
            );
            expect(parsed.TestRun.Results[0].UnitTestResult[1].$.duration).toEqual(
                "0",
            );
            expect(
                parsed.TestRun.Results[0].UnitTestResult[1].Output[0].ErrorInfo[0]
                    .Message[0],
            ).toEqual("Failing stack");
        });
    });

    it("verify postprocess handler", () => {

        const test1: TestCase = {
            module: {
                moduleId: "C:\\Users\\Github\\test.spec.js",
            },
            result: () => ({
                state: "passed"
            }),
            name: "first",
            fullName: () => "first",
            diagnostic: () => ({
                startTime: 1478771929,
                duration: 4100
            }),
        } as TestCase;

        const mockIterator = function () {
            let index = 0;
            const values = [test1];

            return {
                next: function () {
                    if (index < values.length) {
                        return {value: values[index++], done: false};
                    } else {
                        return {value: undefined, done: true};
                    }
                }
            };
        };

        const module: TestModule = {
            moduleId: "C:\\Users\\Github\\test.spec.js",
            children: {
                allSuites: () => [testSuite],
                allTests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIterator
                }),
                tests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIterator
                }),
            },
            state: () => 'passed',
            ok: () => true,
            diagnostic: () => ({
                duration: (4100 + 2900)
            }),
            errors: () => []
        } as TestModule;

        const testSuite: TestSuite = {
            module: module,
            children: {
                allTests: () => [test1],
                tests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIterator
                })
            },
            errors: () => []
        } as TestSuite;

        const addResultFile = (
            testSuiteResult: TestSuite,
            testResult: TestCase,
            testResultNode: XMLElement,
        ): void => {
            testResultNode
                .ele("ResultFiles")
                .ele("ResultFile")
                .att("path", "C:\\Users\\Github\\test\\test.spec.js");
        };

        const options: IOptions = {
            outputFile: "",
            postProcessTestResult: [addResultFile],
        };
        const result = generateTrx([module], options);

        xml2js.parseString(result, (err, parsed) => {
            // Verify the file was added to the UnitTestResult.
            expect(parsed.TestRun.Results[0].UnitTestResult[0].$.outcome).toEqual(
                "Passed",
            );
            expect(
                parsed.TestRun.Results[0].UnitTestResult[0].ResultFiles[0]
                    .ResultFile[0],
            ).toBeTruthy();
            expect(
                parsed.TestRun.Results[0].UnitTestResult[0].ResultFiles[0].ResultFile[0]
                    .$.path,
            ).toBe("C:\\Users\\Github\\test\\test.spec.js");
        });
    });

    it("calculate finishTime from test results", () => {
        const test1: TestCase = {
            module: {
                moduleId: "C:\\testPath\\test.js",
            },
            result: () => ({
                state: "passed"
            }),
            name: "works well",
            fullName: () => "foo's > bar method > works well",
            diagnostic: () => ({
                startTime: 1511376995239,
                duration: 181,
            }),
        } as TestCase;

        const test2: TestCase = {
            module: {
                moduleId: "C:\\testPath\\test.js",
            },
            result: () => ({
                state: "failed",
                errors: [{
                    message: "This did not go as planned"
                }],
                location: {
                    column: 0,
                    line: 0,
                },
            }),
            name: "works not so well",
            fullName: () => "foo's > bar method > works not so well",
            diagnostic: () => ({
                duration: 200
            }),
        } as TestCase;

        const mockIterator = function () {
            let index = 0;
            const values = [test1, test2];

            return {
                next: function () {
                    if (index < values.length) {
                        return {value: values[index++], done: false};
                    } else {
                        return {value: undefined, done: true};
                    }
                }
            };
        };

        const module: TestModule = {
            moduleId: "C:\\testPath\\test.js",
            children: {
                allSuites: () => [testSuite],
                allTests: () => ({
                    next: () => ({value: test1}),
                    [Symbol.iterator]: mockIterator
                }),
                tests: () => ({
                    next: () => ({value: test1}),
                    [Symbol.iterator]: mockIterator
                }),
            },
            state: () => 'passed',
            ok: () => true,
            diagnostic: () => ({
                startTime: 1511376995239,
                duration: (181 + 200)
            }),
            errors: () => []
        } as TestModule;

        const testSuite: TestSuite = {
            module: module,
            children: {
                allTests: () => [test1, test2],
                tests: () => ({
                    next: () => test1,
                    [Symbol.iterator]: mockIterator
                })
            },
            errors: () => []
        } as TestSuite;

        const result = generateTrx([module]);

        xml2js.parseString(result, (err, parsed) => {
            expect(err).toBeFalsy();
            expect(parsed).toBeTruthy();
            expect(parsed.TestRun).toBeTruthy();

            const timeElement = parsed.TestRun.Times[0].$;
            expect(timeElement).toBeTruthy();
            expect(timeElement.start).toBeTruthy();
            expect(timeElement.finish).toBeTruthy();
            expect(timeElement.start).not.toEqual(timeElement.finish);
            expect(timeElement.start).toEqual(new Date(1511376995239).toISOString());
            expect(timeElement.finish).toEqual(new Date(1511376995239 + 200 + 181).toISOString());
        });
    });
});

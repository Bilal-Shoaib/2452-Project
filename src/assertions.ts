//This class can never meet the coverage threshold for code coverage since we always
// define a better exception than 'AssertionError' for each error case.
// An example would be the 'InvalidPriceException' defined by the Product class.
// The aforementioned exception is more specific and can communicate the 'type' of error
// between controllers and views better, relative to the 'AssertionError' which is 
// more generic and less informative. I personally think low coverage here means I wrote better code :)

/**
 * Assert method that throws an error if the provided value is falsy/false boolean expression.
 * @param val the boolean expression/falsy value to evaluate
 * @param message the error message to be shown in case the assertion fails
 * @throws {AssertionError} if the assertion fails
 */
export function assert(val : any, message : string) : asserts val {
    if (!val) {
        throw new AssertionError(message);
    }
}

/**
 * Custom error class for assertion failures.
 */
class AssertionError extends Error {
    constructor(message: string) {
        super(message);
    }
}
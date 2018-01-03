'use strict';

/**
 * Create new errors that can be thrown in Mocha tests
 */

class ExpectedErrorWasNotThrown extends Error {
}

class ErrorWasThrownBeforeExpected extends Error {
}

const expectErrorResponse = (req, data, expectedStatusCode, done) => {
    req
        .send(data)
        .then(() => {
            throw new ExpectedErrorWasNotThrown();
        })
        .catch(err => {
            if (err instanceof ExpectedErrorWasNotThrown) {
                throw err;
            }
            // else handle the expected error
            err.status.should.equal(expectedStatusCode);
        })
        .then(done)
        .catch(done);

};

module.exports = {
    ExpectedErrorWasNotThrown: ExpectedErrorWasNotThrown,
    ErrorWasThrownBeforeExpected: ErrorWasThrownBeforeExpected,
    expectErrorResponse: expectErrorResponse
};
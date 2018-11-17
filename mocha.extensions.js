'use strict';

const expectErrorResponse = (req, data, expectedStatusCode, done) => {
    req
        .send(data)
        .then(res => res.status.should.equal(expectedStatusCode))
        .then(() => null)
        .then(done)
        .catch(done);
};

module.exports = {
    expectErrorResponse: expectErrorResponse
};
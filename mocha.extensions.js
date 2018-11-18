'use strict';

const expectErrorResponse = (req, data, expectedStatusCode) =>
    req.send(data).then(res => res.status.should.equal(expectedStatusCode));

module.exports = {
    expectErrorResponse: expectErrorResponse
};
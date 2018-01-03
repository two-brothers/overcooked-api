'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mochaExt = require('../mocha.extensions');

const should = chai.should();
chai.use(chaiHttp);

const server = require('../www');

describe('dummy', () => {

    const endpoint = '/dummy';

    let request;

    before(() => {
        request = chai.request(server);
    });

    after(() => {
        server.close();
    });

    describe('GET', () => {
        it('should return a dummy response object', done => {
            request
                .get(endpoint)
                .then(res => {
                    res.status.should.equal(200);
                    res.body.data.should.not.equal(null);
                    res.body.data.dummyResponse.should.not.equal(null);
                    res.body.data.dummyResponse.should.equal('Dum de dum dum');
                })
                .then(done)
                .catch(done);
        });
    });

    describe('POST', () => {
        it('should throw a "Not found" error', done => {
            mochaExt.expectErrorResponse(request.post(endpoint), null, 404, done)
        });
    });

    describe('PUT', () => {
        it('should throw a "Not found" error', done => {
            mochaExt.expectErrorResponse(request.put(endpoint), null, 404, done)
        });
    });

    describe('DELETE', () => {
        it('should throw a "Not found" error', done => {
            mochaExt.expectErrorResponse(request.delete(endpoint), null, 404, done)
        });
    });
});

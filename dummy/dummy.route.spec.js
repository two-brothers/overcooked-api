'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const mockgoose = require('mockgoose');
mongoose.Promise = global.Promise;

const mochaExt = require('../mocha.extensions');
const Dummy = require('./dummy.model');

const DBNAME = 'TESTINGDB';
const should = chai.should();
chai.use(chaiHttp);

let server;

describe('/dummy endpoint', () => {
    const endpoint = '/dummy';
    const dummyNames = [
        'Alice',
        'Bob',
        'Charlie',
        'Diane'
    ];

    let request;

    // launch the server and database connection
    before(done => {
        mockgoose(mongoose)
            .then(() => {
                server = require('../www');
                if (mongoose.connection.readyState == 0) {
                    return mongoose.connect(DBNAME);
                }
            })
            .then(() => {
                request = chai.request(server);
            })
            .then(done)
            .catch(done)
    });
    // close the server and database connection
    after(done => {
        server.close();
        mongoose.connection.close()
            .then(done)
            .catch(done)
    });

    // add the dummy records
    beforeEach(done => {
        const creationPromises =
            dummyNames
                .map(n => ({name: n}))
                .map(record => Dummy.create(record));

        Promise
            .all(creationPromises)
            .then(() => null)
            .then(done)
            .catch(done);
    });
    // remove the dummy records
    afterEach(done => mockgoose.reset(done));

    describe('All records', () => {
        describe('GET', () => {
            it('should return the dummy records', done => {
                request
                    .get(endpoint)
                    .then(res => {
                        res.status.should.equal(200);
                        res.body.data.should.not.equal(null);
                        const names = res.body.data.map(record => record.name);
                        names.should.have.members(dummyNames);
                    })
                    .then(done)
                    .catch(done);
            });
        });

        describe('POST', () => {
            it('should return a "Bad Request" error if the new name is not specified', done => {
                mochaExt.expectErrorResponse(request.post(endpoint), null, 400, done)
            });

            it('should return a "Bad Request" error if the new name is null', done => {
                mochaExt.expectErrorResponse(request.post(endpoint), {name: null}, 400, done)
            });

            it('should add a well-specified record to the database', done => {
                const newName = 'Zoltan';
                request
                    .post(endpoint)
                    .send({name: newName})
                    .then(res => {
                        res.status.should.equal(200)
                        res.body.data.should.not.equal(null);
                        res.body.data.name.should.equal(newName);
                    })
                    .then(() => Dummy.findOne({name: newName}))
                    .then(record => record.should.not.equal(null))
                    .then(() => null)
                    .then(done)
                    .catch(done);
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

    describe('Specific record', () => {
        const invalid_id = '123456789012345678901234';
        const invalid_endpoint = `${endpoint}/${invalid_id}`;
        let valid_id;
        let valid_endpoint;

        beforeEach(done => {
            Dummy.find({})
                .then(records => records[2]) // pick one arbitrarily
                .then(record => {
                    valid_id = record._id;
                    valid_endpoint = `${endpoint}/${valid_id}`;
                })
                .then(done)
                .catch(done);
        });

        describe('GET', () => {
            describe('invalid ID', () => {
                it('should return a "Not Found" error', done => {
                    mochaExt.expectErrorResponse(request.get(invalid_endpoint), null, 404, done);
                });
            });

            describe('valid ID', () => {
                it('should return the specified record', done => {
                    let returnedName;
                    request
                        .get(valid_endpoint)
                        .then(res => {
                            res.status.should.equal(200);
                            res.body.data.should.not.equal(null);
                            res.body.data.name.should.not.equal(null);
                            returnedName = res.body.data.name;
                        })
                        .then(() => Dummy.findById(valid_id))
                        .then(record => record.name)
                        .then(expectedName => returnedName.should.equal(expectedName))
                        .then(() => null)
                        .then(done)
                        .catch(done);
                });
            });
        });

        describe('POST', () => {
            describe('invalid ID', () => {
                it('should return a "Not Found" error', done => {
                    mochaExt.expectErrorResponse(request.post(invalid_endpoint), null, 404, done)
                });
            });

            describe('valid ID', () => {
                it('should return a "Not Found" error', done => {
                    mochaExt.expectErrorResponse(request.post(valid_endpoint), null, 404, done)
                });
            });
        });

        describe('PUT', () => {
            const newName = 'Zoltan';

            describe('Invalid ID', () => {
                it('should return a "Bad Request" error if the new name is not specified', done => {
                    mochaExt.expectErrorResponse(request.put(invalid_endpoint), null, 400, done)
                });

                it('should return a "Bad Request" error if the new name is null', done => {
                    mochaExt.expectErrorResponse(request.put(invalid_endpoint), {name: null}, 400, done)
                });

                it('should return a "Not Found" error if the new name is valid', done => {
                    mochaExt.expectErrorResponse(request.put(invalid_endpoint), {name: newName}, 404, done)
                });
            });

            describe('valid ID', () => {
                it('should return a "Bad Request" error if the new name is not specified', done => {
                    mochaExt.expectErrorResponse(request.put(valid_endpoint), null, 400, done)
                });

                it('should return a "Bad Request" error if the new name is null', done => {
                    mochaExt.expectErrorResponse(request.put(valid_endpoint), {name: null}, 400, done)
                });

                it('should update the record if the new name is valid', done => {
                    request
                        .put(valid_endpoint)
                        .send({name: newName})
                        .then(() => Dummy.findById(valid_id))
                        .then(record => record.name.should.equal(newName))
                        .then(() => null)
                        .then(done)
                        .catch(done);
                });
            });

        });

        describe('DELETE', () => {
            describe('Invalid ID', () => {
                it('should throw a "Not found" error', done => {
                    mochaExt.expectErrorResponse(request.delete(invalid_endpoint), null, 404, done)
                });
            });

            describe('valid ID', () => {
                it('should delete the specified record', done => {
                   request
                       .delete(valid_endpoint)
                       .then(() => Dummy.findById(valid_id))
                       .then(record => should.equal(record, null))
                       .then(() => Dummy.find({}))
                       .then(records => records.length.should.equal(dummyNames.length - 1))
                       .then(() => null)
                       .then(done)
                       .catch(done);
                });
            });
        });
    });

});

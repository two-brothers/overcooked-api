'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');

const MockDatabase = require('../mock-database').db;
const DBStructure = require('./food.route.mock-db.spec');
const Enumerator = require('../bdd-enumerator/module');
const Food = require('./food.model');
const MaxUnitType = require('./unit_types').length - 1;
const FoodSample = require('./food.sample');

const should = chai.should();
chai.use(chaiHttp);

const database = new MockDatabase();
database.addModel(Food, DBStructure.models.Food, FoodSample, DBStructure.records.Food);
const foodRecordPromises = database.getAllRecords(DBStructure.models.Food);

describe.only('/food', () => {
    let server;
    before(() => {
        server = require('../www');
    });

    let endpoint;
    let request;

    beforeEach(() => {
        endpoint = '/food';
        request = chai.request(server);
        database.reset();
    });

    const optional = Enumerator.scenario.presence.optional;
    const required = Enumerator.scenario.presence.required;

    describe('POST', () => {
        let data;

        /**
         * Sends the value of 'data' to the listener at 'endpoint' and confirms that
         * the endpoint responds with a 400 (Bad Request) error
         */
        const expectBadPostRequest = () =>
            it('should return a Bad Request error', () =>
                request.post(endpoint)
                    .send(data)
                    .then(res => res.status.should.equal(400))
            );


        /**
         * Sends the value of 'data' to the listener at 'endpoint' and confirms that
         * the endpoint responds with:
         *   - a 200 (OK) response
         *   - the returned record matches the sent 'data' with the addition of an 'id' field
         */
        const expectNewFoodResponse = () =>
            it('should return a 200 (OK) response with the new record', () =>
                request.post(endpoint)
                    .send(data)
                    .then(res => {
                        res.status.should.equal(200);
                        res.body.data.should.not.be.undefined;
                        res.body.data.id.should.not.be.undefined;
                        should.equal(typeof res.body.data.id, 'string');
                        res.body.data.id.length.should.be.greaterThan(0);
                        delete res.body.data.id;
                        res.body.data.should.deep.equal(data);
                    })
            );

        // base the new food on an existing one
        let food;
        beforeEach(() =>
            foodRecordPromises[0]
                .then(food => Object.assign({}, food))
                .then(food => {
                    data = food;
                    delete data.id
                })
        )

        // the property under test is added directly to the data object
        const baseObjFn = () => data;

        const name = Enumerator.scenario.property('name', baseObjFn,
            required(Enumerator.scenario.object([
                new Enumerator.custom.dependent('singular', required(Enumerator.scenario.nonEmptyString)),
                new Enumerator.custom.dependent('plural', required(Enumerator.scenario.nonEmptyString))
            ]))
        );
        Enumerator.enumerate(name, expectNewFoodResponse, expectBadPostRequest);

        // The nonEmptyArray scenario with two different elements is prohibitively expensive to run for a complex object
        // so I will remove it.
        const modifiedNonEmptyArray = (elementScenarios) => Enumerator.scenario.nonEmptyArray(elementScenarios)
            .filter(scenario => scenario.dependents.length < 2);

        const conversions = Enumerator.scenario.property('conversions', baseObjFn,
            required(modifiedNonEmptyArray(
                Enumerator.scenario.object([
                    new Enumerator.custom.dependent('unit_id', required(Enumerator.scenario.boundedInteger(0, MaxUnitType))),
                    new Enumerator.custom.dependent('ratio', required(Enumerator.scenario.finitePositiveNumber))
                ])
            ))
        );
        Enumerator.enumerate(conversions, expectNewFoodResponse, expectBadPostRequest);
    });

    describe('/:id', () => {
        describe('GET', () => {
            describe('specified id is invalid', () => {
                beforeEach(() => {
                    endpoint = `${endpoint}/invalid_id`;
                });

                it('should return a NotFound error', () =>
                    request.get(endpoint).then(res => res.status.should.equal(404))
                );
            });

            describe('the specified id is valid', () => {
                it('should return an OK response with the corresponding record', () =>
                    Promise.all(foodRecordPromises.map(foodRecordPromise =>
                        foodRecordPromise.then(food =>
                            request.get(`${endpoint}/${food.id}`)
                                .then(res => {
                                    res.status.should.equal(200);
                                    res.body.data.should.deep.equal(food)
                                })
                        )
                    ))
                );
            });
        });

        describe('PUT', () => {
            let update;
            let food;
            beforeEach(() =>
                foodRecordPromises[0].then(record => {
                    food = record;
                    update = {};
                })
            );

            const unknownRecordTest = () => {
                describe('specified id is invalid', () => {
                    beforeEach(() => {
                        endpoint = `${endpoint}/invalid_id`;
                    });

                    it('should return a NotFound error', () =>
                        request.put(endpoint).then(res => res.status.should.equal(404))
                    );
                });
            };

            const validFoodTests = () => {
                unknownRecordTest();

                describe('the specified id is valid', () => {
                    let expected;
                    let send;

                    beforeEach(() => {
                        endpoint = `${endpoint}/${food.id}`;
                        expected = Object.assign({}, food, update);
                        send = request.put(endpoint).send(update);
                    });

                    it('should return a NoContent response', () =>
                        send.then(res => res.status.should.equal(204))
                    );

                    it('should update the database appropriately', () =>
                        send
                            .then(() => database.getRecord(DBStructure.models.Food, food.id))
                            .then(updated => {
                                updated.should.deep.equal(expected);
                            })
                    );
                });
            };

            const expectBadPutRequest = () => {
                it('should return a Bad Request error', () =>
                    request.put(`${endpoint}/${food.id}`)
                        .send(update)
                        .then(res => res.status.should.equal(400))
                );
            };

            const baseObjFn = () => update; // properties are added directly to the update object

            const name = Enumerator.scenario.property('name', baseObjFn,
                optional(Enumerator.scenario.object([
                    new Enumerator.custom.dependent('singular', required(Enumerator.scenario.nonEmptyString)),
                    new Enumerator.custom.dependent('plural', required(Enumerator.scenario.nonEmptyString))
                ]))
            );
            Enumerator.enumerate(name, validFoodTests, expectBadPutRequest);

            // The nonEmptyArray scenario with two different elements is prohibitively expensive to run for a complex object
            // so I will remove it.
            const modifiedNonEmptyArray = (elementScenarios) => Enumerator.scenario.nonEmptyArray(elementScenarios)
                .filter(scenario => scenario.dependents.length < 2);

            const conversions = Enumerator.scenario.property('conversions', baseObjFn,
                optional(modifiedNonEmptyArray(
                    Enumerator.scenario.object([
                        new Enumerator.custom.dependent('unit_id', required(Enumerator.scenario.boundedInteger(0, MaxUnitType))),
                        new Enumerator.custom.dependent('ratio', required(Enumerator.scenario.finitePositiveNumber))
                    ])
                ))
            );
            Enumerator.enumerate(conversions, validFoodTests, expectBadPutRequest);

        });

        describe('DELETE', () => {
            describe('specified id is invalid', () => {
                beforeEach(() => {
                    endpoint = `${endpoint}/invalid_id`;
                });

                it('should return a NotFound error', () =>
                    request.delete(endpoint).then(res => res.status.should.equal(404))
                );
            });

            describe('the specified id is valid', () => {
                let food;
                const RecordNotFound = new Error('Record not found before deletion');
                const RecordFound = new Error('Record found after deletion');

                beforeEach(() =>
                    foodRecordPromises[0]
                        .then(record => {
                            food = record;
                            endpoint = `${endpoint}/${food.id}`;
                        })
                );

                it('should return a NoContent response', () =>
                    request.delete(endpoint).then(res => res.status.should.equal(204))
                );

                it('should delete the corresponding food item', () =>
                    database.getRecord(DBStructure.models.Food, food.id)
                        .catch(() => Promise.reject(RecordNotFound))
                        .then(() => request.delete(endpoint))
                        .then(() => database.getRecord(DBStructure.models.Food, food.id))
                        .then(() => Promise.reject(RecordFound))
                        .catch(err => [RecordNotFound, RecordFound].includes(err) ?
                            Promise.reject(err) :
                            null
                        )
                );
            });
        });
    });

    describe('/at/:page', () => {
        const ITEMS_PER_PAGE = 20;
        const expectBadGetRequest = () => {
            it('should return a "Bad Request" error', () =>
                request.get(endpoint).then(res => res.status.should.equal(400))
            )
        };

        beforeEach(() => {
            endpoint = `${endpoint}/at`;
        });

        describe('"page" is a string', () => {
            beforeEach(() => {
                endpoint = `${endpoint}/arbitrary_string`;
            });
            expectBadGetRequest();
        });

        describe('"page" is negative', () => {
            beforeEach(() => {
                endpoint = `${endpoint}/-1`;
            });
            expectBadGetRequest();
        });

        describe('"page" is a fraction', () => {
            beforeEach(() => {
                endpoint = `${endpoint}/3.4`;
            });
            expectBadGetRequest();
        });

        // since we don't know the order of records in the db, it's easier to test all pages at once
        describe('all valid page requests', () => {
            const numPages = Math.ceil(foodRecordPromises.length / ITEMS_PER_PAGE);
            const remainder = foodRecordPromises.length % ITEMS_PER_PAGE;
            const range = new Array(numPages).fill(null).map((_, idx) => idx);
            const compareID = (a, b) => (a.id < b.id ? -1 : 1);

            let sorted;
            before(() =>
                Promise.all(foodRecordPromises)
                    .then(records => {
                        sorted = records;
                        sorted.sort(compareID);
                    })
            );

            it('should collectively return all food items exactly once', () => {
                // precondition for this test
                remainder.should.be.greaterThan(0);

                return Promise.all(range.map(page =>
                    request.get(`${endpoint}/${page}`)
                        .then(res => {
                            res.status.should.equal(200);
                            res.body.data.last_page.should.equal(page === numPages - 1);
                            res.body.data.food.length.should.equal(page === numPages - 1 ? remainder : ITEMS_PER_PAGE);
                            return res.body.data.food;
                        })
                ))
                    .then(pages => pages.reduce((a, b) => a.concat(b)))
                    .then(returned => {
                        returned.sort(compareID).should.deep.equal(sorted)
                    })
            });
        });

        describe('page is too high', () => {
            beforeEach(() => {
                endpoint = `${endpoint}/${Math.ceil(foodRecordPromises.length / ITEMS_PER_PAGE) + 1}`
            });

            it('should return a "Not Found" error', () =>
                request.get(endpoint).then(res => res.status.should.equal(404))
            )
        });
    });
});
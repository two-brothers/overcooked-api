'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const mockgoose = require('mockgoose');
mongoose.Promise = global.Promise;

const Food = require('./food.model');
const UnitTypes = require('./unit_types');
const FoodSample = require('./food.sample');
const DBNAME = 'TESTINGDB';
const should = chai.should();
chai.use(chaiHttp);

let server;

const maxUnitType = UnitTypes.length - 1;

describe('/food', () => {
    let endpoint;
    let request;
    let sample;
    let data;

    // launch the server and database connection
    before(done => {
        mockgoose(mongoose)
            .then(() => {
                server = require('../www');
                if (mongoose.connection.readyState === 0) {
                    return mongoose.connect(DBNAME);
                }
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

    beforeEach(() => {
        endpoint = '/food';
        request = chai.request(server);
        // create a clone of the sample data
        sample = JSON.parse(JSON.stringify(FoodSample));
    });


    describe('POST', () => {

        let food;

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

        /**
         * Uses the 'setter' function to set the value of a property in 'data' to confirm that:
         *   - 'expectBadPostRequest' is successful when the property is not a non-empty string
         *   - 'expectNewFoodResponse' is successful when the property is a non-empty string
         */
        const nonEmptyStringTests = (setter) => {
            describe('is a number', () => {
                beforeEach(() => setter(0));
                expectBadPostRequest();
            });

            describe('is an empty string', () => {
                beforeEach(() => setter(''));
                expectBadPostRequest();
            });

            describe('is a non-empty string', () => {
                beforeEach(() => setter('Arbitrary string'));
                expectNewFoodResponse();
            });
        };

        beforeEach(() => {
            food = sample[0];
            data = food;
        });

        describe('the food name', () => {
            describe('is not defined', () => {
                beforeEach(() => {
                    delete food.name
                });

                expectBadPostRequest();
            });


            describe('singular property', () => {
                describe('is not defined', () => {
                    beforeEach(() => {
                        delete food.name.singular;
                    });

                    expectBadPostRequest();
                });

                nonEmptyStringTests((val) => {
                    food.name.singular = val;
                });
            });

            describe('plural property', () => {
                describe('is not defined', () => {
                    beforeEach(() => {
                        delete food.name.plural;
                    });

                    expectBadPostRequest();
                });

                nonEmptyStringTests((val) => {
                    food.name.plural = val;
                });
            });
        });

        describe('the food conversions property', () => {
            describe('is not defined', () => {
                beforeEach(() => {
                    delete food.conversions;
                });

                expectBadPostRequest();
            });

            describe('is a string', () => {
                beforeEach(() => {
                    food.conversions = 'Arbitrary string';
                });

                expectBadPostRequest();
            });

            describe('is an empty array', () => {
                beforeEach(() => {
                    food.conversions = [];
                });

                expectBadPostRequest();
            });

            describe('is an array where', () => {
                let element;

                /**
                 * Manipulates the conversion item 'element' and ensures the appropriate response is
                 * returned from the endpoint
                 */
                const conversionTests = () => {
                    describe('unit_id', () => {
                        describe('is not defined', () => {
                            beforeEach(() => {
                                delete element.unit_id;
                            });

                            expectBadPostRequest();
                        });

                        describe('is a string', () => {
                            beforeEach(() => {
                                element.unit_id = 'Arbitrary string';
                            });

                            expectBadPostRequest();
                        });

                        describe('is not an integer', () => {
                            beforeEach(() => {
                                element.unit_id = 2.3;
                            });

                            expectBadPostRequest();
                        });

                        describe('is negative', () => {
                            beforeEach(() => {
                                element.unit_id = -1;
                            });

                            expectBadPostRequest();
                        });

                        describe('is zero', () => {
                            beforeEach(() => {
                                element.unit_id = 0;
                            });

                            expectNewFoodResponse();
                        });

                        describe('is in the middle of the expected range', () => {
                            beforeEach(() => {
                                element.unit_id = Math.floor(maxUnitType / 2);
                                element.unit_id.should.be.greaterThan(0);
                                element.unit_id.should.be.lessThan(maxUnitType);
                            });

                            expectNewFoodResponse();
                        });


                        describe('is the maximum allowed value', () => {
                            beforeEach(() => {
                                element.unit_id = maxUnitType;
                            });

                            expectNewFoodResponse();
                        });

                        describe('is more than the maximum allowed value', () => {
                            beforeEach(() => {
                                element.unit_id = maxUnitType + 1;
                            });

                            expectBadPostRequest();
                        });
                    });

                    describe('ratio', () => {
                        describe('is not defined', () => {
                            beforeEach(() => {
                                delete element.ratio;
                            });

                            expectBadPostRequest();
                        });

                        describe('is a string', () => {
                            beforeEach(() => {
                                element.ratio = 'Arbitrary string';
                            });

                            expectBadPostRequest();
                        });

                        describe('is negative', () => {
                            beforeEach(() => {
                                element.ratio = -1;
                            });

                            expectBadPostRequest();
                        });

                        describe('is zero', () => {
                            beforeEach(() => {
                                element.ratio = 0;
                            });

                            expectBadPostRequest();
                        });

                        describe('is 1', () => {
                            beforeEach(() => {
                                element.ratio = 1;
                            });

                            expectNewFoodResponse();
                        });

                        describe('is another positive integer', () => {
                            beforeEach(() => {
                                element.ratio = 2;
                            });

                            expectNewFoodResponse();
                        });

                        describe('is a positive fraction', () => {
                            beforeEach(() => {
                                element.ratio = 0.35;
                            });

                            expectNewFoodResponse();
                        });
                    });
                };

                describe('the first element', () => {
                    beforeEach(() => {
                        element = food.conversions[0];
                    });

                    conversionTests();
                });

                describe('the last element', () => {
                    beforeEach(() => {
                        // some arbitrary valid value
                        element = {
                            unit_id: Math.floor(maxUnitType / 2),
                            ratio: 0.3
                        };

                        food.conversions.push(element);
                    });

                    conversionTests();
                });
            });
        });
    });

    describe('/:id', () => {
        let foodRecords;

        beforeEach(() =>
            Promise.all(
                FoodSample.map(sample =>
                    Food.create(sample)
                        .then(record => record.exportable)
                        // remove the Mongoose specific types
                        .then(record => JSON.parse(JSON.stringify(record)))
                )
            )
                .then(records => {
                    foodRecords = records;
                })
        );

        afterEach(done => mockgoose.reset(done));

        const unknownRecordTests = () => {
            describe('specified id is invalid', () => {
                beforeEach(() => {
                    endpoint = `${endpoint}/invalid_id`;
                });

                it('should return a NotFound error', () =>
                    request.get(endpoint).then(res => res.status.should.equal(404))
                );
            });
        };

        describe('GET', () => {
            unknownRecordTests();

            describe('the specified id is valid', () => {

                it('should return the corresponding record', () =>
                    Promise.all(foodRecords.map(record =>
                        request.get(`${endpoint}/${record.id}`)
                            .then(res => {
                                res.status.should.equal(200);
                                res.body.data.should.deep.equal(record);
                            })
                    ))
                );

            });
        });

        describe('PUT', () => {
            let record;
            let update;

            beforeEach(() => {
                record = foodRecords[0];
                update = {name: {}};
            });

            const stringOptions = (propName, propSetter) => [
                {desc: `${propName} is undefined`, set: () => null, valid: false},
                {desc: `${propName} is a number`, set: () => propSetter(1), valid: false},
                {desc: `${propName} is an empty string`, set: () => propSetter(''), valid: false},
                {desc: `${propName} is a non empty string`, set: () => propSetter('Arbitrary string'), valid: true}
            ];

            const singularSetter = (val) => {
                update.name.singular = val;
            };
            const pluralSetter = (val) => {
                update.name.plural = val;
            };

            // cross product all options for both properties
            const nameOptions = stringOptions('name.singular', singularSetter).map((singularOption, singularIdx) =>
                stringOptions('name.plural', pluralSetter).map((pluralOption, pluralIdx) => ({
                    desc: `${singularOption.desc}; ${pluralOption.desc}`,
                    set: () => {
                        singularOption.set();
                        pluralOption.set();
                    },
                    valid: singularOption.valid && pluralOption.valid
                }))
            ).reduce((a, b) => a.concat(b));
            // add the case where name is undefined
            nameOptions.unshift({
                desc: `name is undefined`,
                set: () => {
                    delete update.name
                },
                valid: true
            });

            nameOptions.map(nameOption => {
                describe(nameOption.desc, () => {
                    beforeEach(nameOption.set);

                    if (nameOption.valid) {
                        unknownRecordTests();

                        describe('the specified id is valid', () => {
                            let expected;
                            let send;

                            beforeEach(() => {
                                endpoint = `${endpoint}/${record.id}`;
                                expected = Object.assign(record, update);
                                send = request.put(endpoint).send(update);
                            });

                            it('should return a NoContent response', () =>
                                send.then(res => res.status.should.equal(204))
                            );

                            it('should update the database appropriately', () =>
                                send.then(() => Food.findOne({_id: record.id}))
                                    .then(updated => updated.exportable)
                                    // remove the Mongoose specific types
                                    .then(updated => JSON.parse(JSON.stringify(updated)))
                                    .then(updated => updated.should.deep.equal(expected))
                            );
                        });
                    } else {
                        it('should return a Bad Request error', () =>
                            request.put(`${endpoint}/${record.id}`)
                                .send(update)
                                .then(res => res.status.should.equal(400))
                        );
                    }

                })
            });

        });
    });
});
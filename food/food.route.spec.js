'use strict'

process.env.NODE_ENV = 'test'

const chai = require('chai')
const chaiHttp = require('chai-http')
const sinon = require('sinon')

const MockDatabase = require('../mock-database').db
const DBStructure = require('./food.route.mock-db.spec')
const Enumerator = require('../bdd-enumerator/module')
const EnumeratorUtil = require('../enumerator-utility')
const Food = require('./food.model')
const MaxUnitType = require('./unitTypes').length - 1
const FoodSample = require('./food.sample')

const should = chai.should()
chai.use(chaiHttp)

const dependent = Enumerator.custom.dependent
const { presence, property, nonEmptyString, finitePositiveNumber, object, boundedInteger } = Enumerator.scenario
const { simplifiedNonEmptyArray } = EnumeratorUtil

const singularScenarios = nonEmptyString
const pluralScenarios = nonEmptyString
const conversionsScenarios = simplifiedNonEmptyArray(object([
    new dependent('unitId', presence.required(boundedInteger(0, MaxUnitType))),
    new dependent('ratio', presence.required(finitePositiveNumber))
]))

describe('/v1/food', () => {
    let server
    let database
    let authenticated

    before(() => {
        const auth = require('../auth/module')
        sinon.stub(auth, 'ensureAuth').callsFake((req, res, next) => authenticated ? next() : res.status(401).send())

        database = new MockDatabase()
        database.addModel(Food, DBStructure.models.Food, FoodSample, DBStructure.records.Food)

        server = require('../www')
    })

    after(() => database.disconnect())

    let endpoint
    let request

    beforeEach(() => {
        endpoint = '/v1/food'
        request = chai.request(server)
        database.reset()
    })

    describe('POST', () => {

        describe('user is authenticated', () => {

            beforeEach(() => {
                authenticated = true
            })

            let data

            /**
             * Sends the value of 'data' to the listener at 'endpoint' and confirms that
             * the endpoint responds with a 400 (Bad Request) error
             */
            const expectBadPostRequest = () =>
                it('should return a Bad Request error', () =>
                    request.post(endpoint)
                        .send(data)
                        .then(res => res.status.should.equal(400))
                )


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
                            res.status.should.equal(200)
                            res.body.data.should.not.be.undefined
                            res.body.data.id.should.not.be.undefined
                            should.equal(typeof res.body.data.id, 'string')
                            res.body.data.id.length.should.be.greaterThan(0)
                            delete res.body.data.id
                            res.body.data.should.deep.equal(data)
                        })
                )

            // base the new food on an existing one
            beforeEach(() =>
                database.getRecord(DBStructure.models.Food, MockDatabase.A_VALID_RECORD_ID)
                    .then(food => Object.assign({}, food))
                    .then(food => {
                        data = food
                        delete data.id
                    })
            )

            // the property under test is added directly to the data object
            const baseObjFn = () => data

            const name = property('name', baseObjFn, presence.required(object([
                new dependent('singular', presence.required(singularScenarios)),
                new dependent('plural', presence.required(pluralScenarios))
            ])))
            const conversions = property('conversions', baseObjFn, presence.required(conversionsScenarios));

            [name, conversions]
                .map(scenarios => Enumerator.enumerate(scenarios, expectNewFoodResponse, expectBadPostRequest))
        })

        describe('user is not authenticated', () => {
            beforeEach(() => {
                authenticated = false
            })

            it('should return an Unauthorised error', () =>
                request.post(endpoint)
                    .send({})
                    .then(res => res.status.should.equal(401))
            )
        })
    })

    describe('/:id', () => {
        describe('GET', () => {
            describe('specified id is invalid', () => {
                beforeEach(() => {
                    endpoint = `${endpoint}/invalidId`
                })

                it('should return a NotFound error', () =>
                    request.get(endpoint).then(res => res.status.should.equal(404))
                )
            })

            describe('specified id is poorly formed', () => {
                beforeEach(() => {
                    endpoint = `${endpoint}/${MockDatabase.A_MALFORMED_RECORD_ID}`
                })

                it('should return a NotFound error', () =>
                    request.get(endpoint).then(res => res.status.should.equal(404))
                )
            })

            describe('specified id is poorly formed', () => {
                beforeEach(() => {
                    endpoint = `${endpoint}/${MockDatabase.A_MALFORMED_RECORD_ID}`
                })

                it('should return a NotFound error', () =>
                    request.get(endpoint).then(res => res.status.should.equal(404))
                )
            })

            describe('the specified id is valid', () => {
                it('should return an OK response with the corresponding record', () =>
                    Promise.all(database.getAllRecords(DBStructure.models.Food)
                        .map(foodRecordPromise => foodRecordPromise.then(food =>
                                request.get(`${endpoint}/${food.id}`)
                                    .then(res => {
                                        res.status.should.equal(200)
                                        res.body.data.should.deep.equal(food)
                                    })
                            )
                        )
                    )
                )
            })
        })

        describe('PUT', () => {
            let update
            let food

            beforeEach(() =>
                database.getRecord(DBStructure.models.Food, MockDatabase.A_VALID_RECORD_ID)
                    .then(record => {
                        food = record
                        update = {}
                    })
            )

            describe('user is authenticated', () => {
                beforeEach(() => {
                    authenticated = true
                })

                const unknownRecordTest = () => {
                    describe('specified id is invalid', () => {
                        beforeEach(() => {
                            endpoint = `${endpoint}/invalidId`
                        })

                        it('should return a NotFound error', () =>
                            request.put(endpoint).then(res => res.status.should.equal(404))
                        )
                    })

                    describe('specified id is poorly formed', () => {
                        beforeEach(() => {
                            endpoint = `${endpoint}/${MockDatabase.A_MALFORMED_RECORD_ID}`
                        })

                        it('should return a NotFound error', () =>
                            request.put(endpoint).then(res => res.status.should.equal(404))
                        )
                    })
                }

                const validFoodTests = () => {
                    unknownRecordTest()

                    describe('the specified id is valid', () => {
                        let expected
                        let send

                        beforeEach(() => {
                            endpoint = `${endpoint}/${food.id}`
                            expected = Object.assign({}, food, update)
                            send = request.put(endpoint).send(update)
                        })

                        it('should return a NoContent response', () =>
                            send.then(res => res.status.should.equal(204))
                        )

                        it('should update the database appropriately', () =>
                            send
                                .then(() => database.getRecord(DBStructure.models.Food, food.id))
                                .then(updated => {
                                    updated.should.deep.equal(expected)
                                })
                        )
                    })
                }

                const expectBadPutRequest = () => {
                    it('should return a Bad Request error', () =>
                        request.put(`${endpoint}/${food.id}`)
                            .send(update)
                            .then(res => res.status.should.equal(400))
                    )
                }

                const baseObjFn = () => update // properties are added directly to the update object
                const name = property('name', baseObjFn, presence.optional(object([
                    new dependent('singular', presence.required(singularScenarios)),
                    new dependent('plural', presence.required(pluralScenarios))
                ])))
                const conversions = property('conversions', baseObjFn, presence.optional(conversionsScenarios));

                [name, conversions]
                    .map(scenarios => Enumerator.enumerate(scenarios, validFoodTests, expectBadPutRequest))
            })

            describe('user is not authenticated', () => {
                beforeEach(() => {
                    authenticated = false
                })

                it('should return an Unauthorised error', () =>
                    request.put(`${endpoint}/${food.id}`)
                        .send({})
                        .then(res => res.status.should.equal(401))
                )
            })


        })

        describe('DELETE', () => {
            describe('user is authenticated', () => {
                beforeEach(() => {
                    authenticated = true
                })

                describe('specified id is invalid', () => {
                    beforeEach(() => {
                        endpoint = `${endpoint}/invalidId`
                    })

                    it('should return a NotFound error', () =>
                        request.delete(endpoint).then(res => res.status.should.equal(404))
                    )
                })

                describe('specified id is poorly formed', () => {
                    beforeEach(() => {
                        endpoint = `${endpoint}/${MockDatabase.A_MALFORMED_RECORD_ID}`
                    })

                    it('should return a NotFound error', () =>
                        request.delete(endpoint).then(res => res.status.should.equal(404))
                    )
                })

                describe('the specified id is valid', () => {
                    let food
                    const RecordNotFound = new Error('Record not found before deletion')
                    const RecordFound = new Error('Record found after deletion')

                    beforeEach(() =>
                        database.getRecord(DBStructure.models.Food, MockDatabase.A_VALID_RECORD_ID)
                            .then(record => {
                                food = record
                                endpoint = `${endpoint}/${food.id}`
                            })
                    )

                    it('should return a NoContent response', () =>
                        request.delete(endpoint).then(res => res.status.should.equal(204))
                    )

                    it('should delete the corresponding food item', () =>
                        database.getRecord(DBStructure.models.Food, food.id)
                            .catch(() => Promise.reject(RecordNotFound))
                            .then(() => request.delete(endpoint))
                            .then(() => database.getRecord(DBStructure.models.Food, food.id))
                            .then(record => record ? Promise.reject(RecordFound) : null)
                    )
                })
            })

            describe('user is not authenticated', () => {
                beforeEach(() =>
                    database.getRecord(DBStructure.models.Food, MockDatabase.A_VALID_RECORD_ID)
                        .then(record => {
                            endpoint = `${endpoint}/${record.id}`
                            authenticated = false
                        })
                )

                it('should return an Unauthorised error', () =>
                    request.delete(endpoint).then(res => res.status.should.equal(401))
                )
            })
        })
    })

    describe('/at/:page', () => {
        const ITEMS_PER_PAGE = 20

        let numPages, remainder, sorted
        const compareID = (a, b) => (a.id < b.id ? -1 : 1)
        before(() => {
            database.reset()
            const recordPromises = database.getAllRecords(DBStructure.models.Food)
            numPages = Math.ceil(recordPromises.length / ITEMS_PER_PAGE)
            remainder = recordPromises.length % ITEMS_PER_PAGE
            return Promise.all(recordPromises)
                .then(records => {
                    sorted = records
                    sorted.sort(compareID)
                })
        })

        beforeEach(() => {
            endpoint = `${endpoint}/at`
        })

        const expectBadGetRequest = () => {
            it('should return a "Bad Request" error', () =>
                request.get(endpoint).then(res => res.status.should.equal(400))
            )
        }

        describe('"page" is a string', () => {
            beforeEach(() => {
                endpoint = `${endpoint}/arbitraryString`
            })
            expectBadGetRequest()
        })

        describe('"page" is negative', () => {
            beforeEach(() => {
                endpoint = `${endpoint}/-1`
            })
            expectBadGetRequest()
        })

        describe('"page" is a fraction', () => {
            beforeEach(() => {
                endpoint = `${endpoint}/3.4`
            })
            expectBadGetRequest()
        })

        describe('first page request', () => {
            beforeEach(() => {
                endpoint = `${endpoint}/0`
                numPages.should.be.greaterThan(1) // precondition for this test
            })

            it('should return the first page of items sorted by ID', () => {
                request.get(endpoint)
                    .then(res => {
                        res.status.should.equal(200)
                        res.body.data.lastPage.should.equal(false)
                        res.body.data.food.length.should.equal(ITEMS_PER_PAGE)
                        res.body.data.food.should.deep.equal(sorted.slice(0, ITEMS_PER_PAGE))
                    })
            })
        })

        describe('last page request', () => {
            beforeEach(() => {
                endpoint = `${endpoint}/${numPages - 1}`
                remainder.should.be.greaterThan(0) // precondition for this test
            })

            it('should return the last page of items sorted by ID', () =>
                request.get(endpoint)
                    .then(res => {
                        res.status.should.equal(200)
                        res.body.data.lastPage.should.equal(true)
                        res.body.data.food.length.should.equal(remainder)
                        res.body.data.food.should.deep.equal(sorted.slice((numPages - 1) * ITEMS_PER_PAGE))
                    })
            )
        })

        describe('all valid page requests', () => {
            let pageIndices
            before(() => {
                pageIndices = new Array(numPages).fill(0).map((_, idx) => idx)
            })

            it('should collectively return all food items in sorted order', () =>
                Promise.all(pageIndices.map(pageIdx =>
                    request.get(`${endpoint}/${pageIdx}`)
                        .then(res => {
                            res.status.should.equal(200)
                            res.body.data.lastPage.should.equal(pageIdx === numPages - 1)
                            res.body.data.food.length.should.equal(pageIdx === numPages - 1 ? remainder : ITEMS_PER_PAGE)
                            return res.body.data.food
                        })
                ))
                    .then(pages => pages.reduce((a, b) => a.concat(b)))
                    .then(returned => returned.should.deep.equal(sorted))
            )
        })

        describe('page is too high', () => {
            beforeEach(() => {
                const pageIdx = Math.ceil(database.getAllRecords(DBStructure.models.Food).length / ITEMS_PER_PAGE) + 1
                endpoint = `${endpoint}/${pageIdx}`
            })

            it('should return an OK response', () =>
                request.get(endpoint).then(res => res.status.should.equal(200))
            )

            it('should return an empty list', () =>
                request.get(endpoint).then(res => res.body.data.food.should.deep.equal([]))
            )

            it('should set lastPage to true', () =>
                request.get(endpoint).then(res => res.body.data.lastPage.should.equal(true))
            )
        })
    })
})


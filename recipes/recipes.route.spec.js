'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');

const MockDatabase = require('../mock-database').db;
const DBStructure = require('./recipes.route.mock-db.spec');
const Enumerator = require('../bdd-enumerator/module');
const Food = require('../food/module').model;
const FoodSample = require('../food/module').sample;
const MaxUnitType = require('../food/module').unit_types.length - 1;
const Recipe = require('./recipe.model');
const RecipesSample = require('./recipe.sample');

const should = chai.should();
chai.use(chaiHttp);

const database = new MockDatabase();
database.addModel(Food, DBStructure.models.Food, FoodSample, DBStructure.records.Food);
// the sample recipes have Food ID indices instead of Food IDs. Substitute them.
const foodIds = database.getAllRecords(DBStructure.models.Food).map(record => record.id);
const recipesSample = JSON.parse(JSON.stringify(RecipesSample));
recipesSample.map(recipe => recipe.ingredient_sections.map(sections => sections.ingredients.map(ingredient => {
    ingredient.food_id = foodIds[ingredient.food_id]
})));
database.addModel(Recipe, DBStructure.models.Recipe, recipesSample, DBStructure.records.Recipe);

const optional = Enumerator.scenario.presence.optional;
const required = Enumerator.scenario.presence.required;

const validFoodId = database.getAllRecords(DBStructure.models.Food)[0].id;
const foodID = [
    new Enumerator.custom.simple('is an integer', 1, false),
    new Enumerator.custom.simple('is an empty string', '', false),
    new Enumerator.custom.simple('is not a valid food id', 'invalid_id', false),
    new Enumerator.custom.simple('is a valid id', validFoodId, true)
];

describe.only('/recipes', () => {
    let server;
    before(() => {
        server = require('../www');
    });


    let endpoint;
    let request;

    beforeEach(() => {
        endpoint = '/recipes';
        request = chai.request(server);
        database.reset();
    });

    describe('POST', () => {
        const initial_timestamp = Date.now();
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
        const expectNewRecipeResponse = () =>
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

                        // note that in this test, the client and server share a clock so there
                        // is no risk of time-drift errors
                        res.body.data.last_updated.should.not.be.undefined;
                        should.equal(typeof res.body.data.last_updated, 'number');
                        res.body.data.last_updated.should.be.gte(initial_timestamp);
                        res.body.data.last_updated.should.be.lte(Date.now());
                        delete res.body.data.last_updated;

                        res.body.data.should.deep.equal(data);
                    })
            );

        // base the new recipe on an existing one
        const recipe = database.getAllRecords(DBStructure.models.Recipe)[0];
        beforeEach(() => {
            data = Object.assign({}, recipe);
            // remove the properties set by the server
            delete data.id;
            delete data.last_updated;
        });

        // the property under test is added directly to the data object
        const baseObjFn = () => data;

        const title = Enumerator.scenario.property('title', baseObjFn, required(Enumerator.scenario.nonEmptyString));
        Enumerator.enumerate(title, expectNewRecipeResponse, expectBadPostRequest);

        const makesAndServes = Enumerator.scenario.xorProperties(
            baseObjFn,
            new Enumerator.custom.dependent('makes', optional(Enumerator.scenario.finitePositiveNumber)),
            new Enumerator.custom.dependent('serves', optional(Enumerator.scenario.finitePositiveNumber))
        );
        Enumerator.enumerate(makesAndServes, expectNewRecipeResponse, expectBadPostRequest);

        const prepTime = Enumerator.scenario.property('prep_time', baseObjFn, required(Enumerator.scenario.finitePositiveNumber));
        Enumerator.enumerate(prepTime, expectNewRecipeResponse, expectBadPostRequest);

        const cookTime = Enumerator.scenario.property('cook_time', baseObjFn, required(Enumerator.scenario.finitePositiveNumber));
        Enumerator.enumerate(cookTime, expectNewRecipeResponse, expectBadPostRequest);

        // The nonEmptyArray scenario with two different elements is prohibitively expensive to run for a complex
        // object like ingredient_sections so I will remove it.
        const modifiedNonEmptyArray = (elementScenarios) => Enumerator.scenario.nonEmptyArray(elementScenarios)
            .filter(scenario => scenario.dependents.length < 2);

        const ingredient_sections = Enumerator.scenario.property(
            'ingredient_sections',
            baseObjFn,
            required(modifiedNonEmptyArray(
                Enumerator.scenario.object([
                    new Enumerator.custom.dependent('heading', optional(Enumerator.scenario.nonEmptyString)),
                    new Enumerator.custom.dependent(
                        'ingredients',
                        required(modifiedNonEmptyArray(
                            Enumerator.scenario.object([
                                new Enumerator.custom.dependent('amount', required(Enumerator.scenario.finitePositiveNumber)),
                                new Enumerator.custom.dependent('unit_id', required(Enumerator.scenario.boundedInteger(0, MaxUnitType))),
                                new Enumerator.custom.dependent('food_id', required(foodID))
                            ])
                        ))
                    )
                ])
            ))
        );
        Enumerator.enumerate(ingredient_sections, expectNewRecipeResponse, expectBadPostRequest);

        const method = Enumerator.scenario.property('method', baseObjFn,
            required(Enumerator.scenario.nonEmptyArray(Enumerator.scenario.nonEmptyString))
        );
        Enumerator.enumerate(method, expectNewRecipeResponse, expectBadPostRequest);

        const reference = Enumerator.scenario.property('reference_url', baseObjFn,
            required(Enumerator.scenario.nonEmptyString)
        );
        Enumerator.enumerate(reference, expectNewRecipeResponse, expectBadPostRequest);
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
                let recipeRecord, foodRecords;

                before(() => {
                    recipeRecord = database.getAllRecords(DBStructure.models.Recipe)[0];
                    foodRecords = database.getAllRecords(DBStructure.models.Food);
                });

                beforeEach(() => {
                    endpoint = `${endpoint}/${recipeRecord.id}`;
                });

                it('should return an OK response', () =>
                    request.get(endpoint).then(res => res.status.should.equal(200))
                );

                it('should return the recipe record', () =>
                    request.get(endpoint)
                        .then(res => res.body.data.recipe.should.deep.equal(recipeRecord))
                );

                it('should return the food items required by the recipe', () =>
                    request.get(endpoint)
                        .then(res => res.body.data.food)
                        .then(foods => foods.map(food => {
                            const foodRecord = foodRecords.filter(r => r.id === food.id)[0];
                            food.should.deep.equal(foodRecord);
                        }))
                );
            });
        });

        describe('PUT', () => {
            const recipe = database.getAllRecords(DBStructure.models.Recipe)[0];

            let update;

            beforeEach(() => {
                update = {};
            });

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


            const validRecipeTests = () => {
                unknownRecordTest();

                describe('the specified id is valid', () => {
                    let expected;
                    let send;

                    beforeEach(() => {
                        endpoint = `${endpoint}/${recipe.id}`;
                        expected = Object.assign({}, recipe, update);
                        if (update.serves && expected.makes)
                            delete expected.makes;
                        if (update.makes && expected.serves)
                            delete expected.serves;
                        send = request.put(endpoint).send(update);
                    });

                    it('should return a NoContent response', () =>
                        send.then(res => res.status.should.equal(204))
                    );

                    it('should update the database appropriately', () =>
                        send
                            .then(() => database.getRecord(DBStructure.models.Recipe, recipe.id))
                            .then(updated => {
                                updated.last_updated.should.not.be.undefined;
                                should.equal(typeof updated.last_updated, 'number');
                                updated.last_updated.should.be.gte(expected.last_updated);
                                expected.last_updated = updated.last_updated;
                                updated.should.deep.equal(expected);
                            })
                    );
                });
            };

            const invalidRecipeTests = () => {
                it('should return a Bad Request error', () =>
                    request.put(`${endpoint}/${recipe.id}`)
                        .send(update)
                        .then(res => res.status.should.equal(400))
                );
            };

            // The cross-product of all options is too large to exhaust
            // Instead, treat each property update individually

            const baseObjFn = () => update; // properties are added directly to the update object

            const title = Enumerator.scenario.property('title', baseObjFn, optional(Enumerator.scenario.nonEmptyString));
            Enumerator.enumerate(title, validRecipeTests, invalidRecipeTests);

            const makesAndServes = Enumerator.scenario.mutexProperties(
                baseObjFn,
                new Enumerator.custom.dependent('makes', optional(Enumerator.scenario.finitePositiveNumber)),
                new Enumerator.custom.dependent('serves', optional(Enumerator.scenario.finitePositiveNumber))
            );
            Enumerator.enumerate(makesAndServes, validRecipeTests, invalidRecipeTests);

            const prepTime = Enumerator.scenario.property('prep_time', baseObjFn, optional(Enumerator.scenario.finitePositiveNumber));
            Enumerator.enumerate(prepTime, validRecipeTests, invalidRecipeTests);

            const cookTime = Enumerator.scenario.property('cook_time', baseObjFn, optional(Enumerator.scenario.finitePositiveNumber));
            Enumerator.enumerate(cookTime, validRecipeTests, invalidRecipeTests);

            // The nonEmptyArray scenario with two different elements is prohibitively expensive to run for a complex
            // object like ingredient_sections so I will remove it.
            const modifiedNonEmptyArray = (elementScenarios) => Enumerator.scenario.nonEmptyArray(elementScenarios)
                .filter(scenario => scenario.dependents.length < 2);

            const ingredient_sections = Enumerator.scenario.property(
                'ingredient_sections',
                baseObjFn,
                optional(modifiedNonEmptyArray(
                    Enumerator.scenario.object([
                        new Enumerator.custom.dependent('heading', optional(Enumerator.scenario.nonEmptyString)),
                        new Enumerator.custom.dependent(
                            'ingredients',
                            required(modifiedNonEmptyArray(
                                Enumerator.scenario.object([
                                    new Enumerator.custom.dependent('amount', required(Enumerator.scenario.finitePositiveNumber)),
                                    new Enumerator.custom.dependent('unit_id', required(Enumerator.scenario.boundedInteger(0, MaxUnitType))),
                                    new Enumerator.custom.dependent('food_id', required(foodID))
                                ])
                            ))
                        )
                    ])
                ))
            );
            Enumerator.enumerate(ingredient_sections, validRecipeTests, invalidRecipeTests);

            const method = Enumerator.scenario.property('method', baseObjFn,
                optional(Enumerator.scenario.nonEmptyArray(Enumerator.scenario.nonEmptyString))
            );
            Enumerator.enumerate(method, validRecipeTests, invalidRecipeTests);

            const reference = Enumerator.scenario.property('reference_url', baseObjFn,
                optional(Enumerator.scenario.nonEmptyString)
            );
            Enumerator.enumerate(reference, validRecipeTests, invalidRecipeTests);

        });
    });
});

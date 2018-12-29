'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');

const MockDatabase = require('../mock-database').db;
const DBStructure = require('./recipes.route.mock-db.spec');
const Enumerator = require('../bdd-enumerator/module');
const EnumeratorUtil = require('../enumerator-utility');
const Food = require('../food/module').model;
const FoodSample = require('../food/module').sample;
const MaxUnitType = require('../food/module').unit_types.length - 1;
const Recipe = require('./recipe.model');
const RecipesSample = require('./recipe.sample');

const should = chai.should();
chai.use(chaiHttp);

const {simple, dependent} = Enumerator.custom;
const {
    presence, property, nonEmptyString, xorProperties, mutexProperties, finitePositiveNumber, object, boundedInteger
} = Enumerator.scenario;
const {simplifiedNonEmptyArray} = EnumeratorUtil;

const titleScenarios = nonEmptyString;
const makesScenarios = finitePositiveNumber;
const servesScenarios = finitePositiveNumber;
const prepTimeScenarios = finitePositiveNumber;
const cookTimeScenarios = finitePositiveNumber;
const foodIDScenarios = [
    new simple('is an integer', 1, false),
    new simple('is an empty string', '', false),
    new simple('is not a valid food id', 'invalid_id', false),
    new simple('is a malformed food id', MockDatabase.A_MALFORMED_RECORD_ID, false),
    new simple('is a valid id', MockDatabase.A_VALID_RECORD_ID, true)
];
// the scenarios for Quantified Ingredients
const ingredientScenarios = object([
    new dependent('ingredient_type', [new simple('is "Quantified"', 'Quantified', true)]),
    new dependent('amount', presence.required(finitePositiveNumber)),
    new dependent('unit_ids', simplifiedNonEmptyArray(presence.required(boundedInteger(0, MaxUnitType)))),
    new dependent('food_id', presence.required(foodIDScenarios)),
    new dependent('additional_desc', presence.optional(nonEmptyString))
]) // the scenarios for FreeText Ingredients
.concat(object([
    new dependent('ingredient_type', [new simple('is "FreeText"', 'FreeText', true)]),
    new dependent('description', presence.required(nonEmptyString))
]))
// a scenario for an unknown ingredient type
.concat(object([
    new dependent('ingredient_type', [
        new simple('is "AnotherType"', 'AnotherType', false)
    ])
]));
const ingredientSectionsScenarios = simplifiedNonEmptyArray(object([
    new dependent('heading', presence.optional(nonEmptyString)),
    new dependent('ingredients', presence.required(simplifiedNonEmptyArray(ingredientScenarios)))
]));
const methodScenarios = simplifiedNonEmptyArray(nonEmptyString);
const referenceUrlScenarios = nonEmptyString;
const imageUrlScenarios = nonEmptyString;

describe('/recipes', () => {
    let server;
    let database;
    let authenticated;

    before(() => {
        const auth = require('../auth/module');
        sinon.stub(auth, 'ensureAuth').callsFake((req, res, next) => authenticated ? next() : res.status(401).send());

        database = new MockDatabase();
        database.addModel(Food, DBStructure.models.Food, FoodSample, DBStructure.records.Food);
        // the sample recipes have Food ID indices instead of Food IDs. Substitute them.
        const recipeSamples = JSON.parse(JSON.stringify(RecipesSample));

        return Promise.all(database.getAllRecords(DBStructure.models.Food))
            .then(foodRecords => {
                recipeSamples.map(recipe => recipe.ingredient_sections.map(sections => sections.ingredients.map(ingredient => {
                    if (ingredient.ingredient_type === 'Quantified') {
                        ingredient.food_id = foodRecords[ingredient.food_id].id;
                    }
                })))
            })
            .then(() => database.addModel(Recipe, DBStructure.models.Recipe, recipeSamples, DBStructure.records.Recipe))
            .then(() => {
                server = require('../www');
            });
    });

    after(() => database.disconnect());

    let endpoint;
    let request;

    beforeEach(() => {
        endpoint = '/recipes';
        request = chai.request(server);
        database.reset();
    });

    describe('POST', () => {
        describe('user is authenticated', () => {
            beforeEach(() => {
                authenticated = true;
            });

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

                            res.body.data.last_updated.should.not.be.undefined;
                            should.equal(typeof res.body.data.last_updated, 'number');
                            res.body.data.last_updated.should.be.lte(Date.now());
                            delete res.body.data.last_updated;

                            res.body.data.should.deep.equal(data);
                        })
                );

            beforeEach(() =>
                database.getRecord(DBStructure.models.Recipe, MockDatabase.A_VALID_RECORD_ID)
                    .then(recipe => {
                        data = Object.assign({}, recipe);
                        // remove the properties set by the server
                        delete data.id;
                        delete data.last_updated;
                    })
            );

            // the property under test is added directly to the data object
            const baseObjFn = () => data;

            const title = property('title', baseObjFn, presence.required(titleScenarios));
            const makesAndServes = xorProperties(
                baseObjFn,
                new dependent('makes', presence.optional(makesScenarios)),
                new dependent('serves', presence.optional(servesScenarios))
            );
            const prepTime = property('prep_time', baseObjFn, presence.required(prepTimeScenarios));
            const cookTime = property('cook_time', baseObjFn, presence.required(cookTimeScenarios));
            const ingredient_sections = property('ingredient_sections', baseObjFn, presence.required(ingredientSectionsScenarios));
            const method = property('method', baseObjFn, presence.required(methodScenarios));
            const reference = property('reference_url', baseObjFn, presence.required(referenceUrlScenarios));
            const image = property('image_url', baseObjFn, presence.required(imageUrlScenarios));

            [title, makesAndServes, prepTime, cookTime, ingredient_sections, method, reference, image]
                .map(scenarios => Enumerator.enumerate(scenarios, expectNewRecipeResponse, expectBadPostRequest));

        });

        describe('user is not authenticated', () => {
            beforeEach(() => {
                authenticated = false;
            });

            it('should return an Unauthorised error', () =>
                request.post(endpoint)
                    .send({})
                    .then(res => res.status.should.equal(401))
            );
        });

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

            describe('specified id is poorly formed', () => {
                beforeEach(() => {
                    endpoint = `${endpoint}/${MockDatabase.A_MALFORMED_RECORD_ID}`;
                });

                it('should return a NotFound error', () =>
                    request.get(endpoint).then(res => res.status.should.equal(404))
                );
            });

            describe('the specified id is valid', () => {
                let recipeRecord, foodRecords;

                before(() => {
                    database.reset();
                    database.getRecord(DBStructure.models.Recipe, MockDatabase.A_VALID_RECORD_ID)
                        .then(record => {
                            // ensure the record has both ingredient types to exercise all code paths
                            const ingTypes = record.ingredient_sections
                                .map(section => section.ingredients)
                                .reduce((a, b) => a.concat(b))
                                .map(ingredient => ingredient.ingredient_type);
                            ingTypes.includes('Quantified').should.equal(true);
                            ingTypes.includes('FreeText').should.equal(true);

                            recipeRecord = record;
                        })
                        .then(() => Promise.all(database.getAllRecords(DBStructure.models.Food)))
                        .then(foods => {
                            foodRecords = foods;
                        })
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
            let update;
            let recipe;

            beforeEach(() =>
                database.getRecord(DBStructure.models.Recipe, MockDatabase.A_VALID_RECORD_ID)
                    .then(record => {
                        recipe = record;
                        update = {};
                    })
            );

            describe('user is authenticated', () => {
                beforeEach(() => {
                    authenticated = true;
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

                    describe('specified id is poorly formed', () => {
                        beforeEach(() => {
                            endpoint = `${endpoint}/${MockDatabase.A_MALFORMED_RECORD_ID}`;
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

                const title = property('title', baseObjFn, presence.optional(titleScenarios));
                const makesAndServes = mutexProperties(
                    baseObjFn,
                    new dependent('makes', presence.optional(makesScenarios)),
                    new dependent('serves', presence.optional(servesScenarios))
                );
                const prepTime = property('prep_time', baseObjFn, presence.optional(prepTimeScenarios));
                const cookTime = property('cook_time', baseObjFn, presence.optional(cookTimeScenarios));
                const ingredient_sections = property('ingredient_sections', baseObjFn, presence.optional(ingredientSectionsScenarios));
                const method = property('method', baseObjFn, presence.optional(methodScenarios));
                const reference = property('reference_url', baseObjFn, presence.optional(referenceUrlScenarios));
                const image = property('image_url', baseObjFn, presence.optional(imageUrlScenarios));

                [title, makesAndServes, prepTime, cookTime, ingredient_sections, method, reference, image]
                    .map(scenarios => Enumerator.enumerate(scenarios, validRecipeTests, invalidRecipeTests));
            });

            describe('user is not authenticated', () => {
                beforeEach(() => {
                    authenticated = false;
                });

                it('should return an Unauthorised error', () =>
                    request.put(`${endpoint}/${recipe.id}`)
                        .send(update)
                        .then(res => res.status.should.equal(401))
                );
            });

        });

        describe('DELETE', () => {
            describe('user is authenticated', () => {
                beforeEach(() => {
                    authenticated = true;
                });

                describe('specified id is invalid', () => {
                    beforeEach(() => {
                        endpoint = `${endpoint}/invalid_id`;
                    });

                    it('should return a NotFound error', () =>
                        request.delete(endpoint).then(res => res.status.should.equal(404))
                    );
                });

                describe('specified id is poorly formed', () => {
                    beforeEach(() => {
                        endpoint = `${endpoint}/${MockDatabase.A_MALFORMED_RECORD_ID}`;
                    });

                    it('should return a NotFound error', () =>
                        request.delete(endpoint).then(res => res.status.should.equal(404))
                    );
                });

                describe('the specified id is valid', () => {
                    let recipe;
                    const RecordNotFound = new Error('Record not found before deletion');
                    const RecordFound = new Error('Record found after deletion');

                    beforeEach(() =>
                        database.getRecord(DBStructure.models.Recipe, MockDatabase.A_VALID_RECORD_ID)
                            .then(record => {
                                recipe = record;
                                endpoint = `${endpoint}/${recipe.id}`;
                            })
                    );

                    it('should return a NoContent response', () =>
                        request.delete(endpoint).then(res => res.status.should.equal(204))
                    );

                    it('should delete the corresponding recipe', () =>
                        database.getRecord(DBStructure.models.Recipe, recipe.id)
                            .catch(() => Promise.reject(RecordNotFound))
                            .then(() => request.delete(endpoint))
                            .then(() => database.getRecord(DBStructure.models.Recipe, recipe.id))
                            .then(recipe => recipe ? Promise.reject(RecordFound) : null)
                    );
                });
            });

            describe('user is not authenticated', () => {
                beforeEach(() =>
                    database.getRecord(DBStructure.models.Recipe, MockDatabase.A_VALID_RECORD_ID)
                        .then(record => {
                            endpoint = `${endpoint}/${record.id}`;
                            authenticated = false;
                        })
                );

                it('should return an Unauthorised response', () =>
                    request.delete(endpoint).then(res => res.status.should.equal(401))
                );
            });
        });
    });

    describe('/at/:page', () => {
        const ITEMS_PER_PAGE = 10;

        let numPages, remainder, sortedRecipes, foodRecords;
        // reverse chronological order
        const compareTimestamp = (a, b) => (a.last_updated < b.last_updated ? 1 : -1);
        before(() => {
            database.reset();
            const recipePromises = database.getAllRecords(DBStructure.models.Recipe);
            const foodPromises = database.getAllRecords(DBStructure.models.Food);
            numPages = Math.ceil(recipePromises.length / ITEMS_PER_PAGE);
            remainder = recipePromises.length % ITEMS_PER_PAGE;
            return Promise.all(recipePromises)
                .then(recipes => {
                    sortedRecipes = recipes;
                    sortedRecipes.sort(compareTimestamp);
                })
                .then(() => Promise.all(foodPromises))
                .then(food => {
                    foodRecords = food;
                })
        });

        beforeEach(() => {
            endpoint = `${endpoint}/at`;
        });

        const expectBadGetRequest = () => {
            it('should return a "Bad Request" error', () =>
                request.get(endpoint).then(res => res.status.should.equal(400))
            )
        };

        const expectPageToBeConsistent = () => {
            it('should return food items associated with the recipes', () =>
                request.get(endpoint)
                    .then(res => {
                        const flatten = (a, b) => a.concat(b);
                        const foodIds = res.body.data.food.map(food => food.id);
                        res.body.data.recipes
                            .map(recipe => recipe.ingredient_sections).reduce(flatten)
                            .map(section => section.ingredients).reduce(flatten)
                            .filter(ingredient => ingredient.ingredient_type === 'Quantified')
                            .map(ingredient => ingredient.food_id)
                            .map(id => foodIds.includes(id).should.equal(true))
                    })
            );

            it('should not return excessive food items', () => {
                request.get(endpoint)
                    .then(res => {
                        const flatten = (a, b) => a.concat(b);
                        const requiredFoods = res.body.data.recipes
                            .map(recipe => recipe.ingredient_sections).reduce(flatten)
                            .map(section => section.ingredients).reduce(flatten)
                            .filter(ingredient => ingredient.ingredient_type === 'Quantified')
                            .map(ingredient => ingredient.food_id);
                        res.body.data.food.map(food =>
                            requiredFoods.includes(food.id).should.equal(true)
                        )
                    })
            });

            it('should not return duplicate food items', () =>
                request.get(endpoint)
                    .then(res => res.body.data.food)
                    .then(items => items.map((food, idx, arr) => arr.indexOf(food).should.equal(idx)))
            );

            it('should match the food items in the database', () => {
                request.get(endpoint)
                    .then(res => res.body.data.food)
                    .then(items => items.map(food =>
                        food.should.deep.equal(foodRecords.filter(record => record.id === food.id)[0])
                    ))
            });
        };


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

        describe('first page request', () => {
            beforeEach(() => {
                endpoint = `${endpoint}/0`;
                numPages.should.be.greaterThan(1); // precondition for this test
            });

            it('should return an OK response with the first page of items sorted by timestamp', () =>
                request.get(endpoint)
                    .then(res => {
                        res.status.should.equal(200);
                        res.body.data.recipes.length.should.equal(ITEMS_PER_PAGE);
                        res.body.data.recipes.should.deep.equal(sortedRecipes.slice(0, ITEMS_PER_PAGE));
                    })
            );

            it('should not be the last page', () =>
                request.get(endpoint)
                    .then(res => res.body.data.last_page.should.equal(false))
            );

            expectPageToBeConsistent();
        });

        describe('last page request', () => {
            beforeEach(() => {
                endpoint = `${endpoint}/${numPages - 1}`;
                remainder.should.be.greaterThan(0); // precondition for this test
            });

            it('should return an OK response with the last page of items sorted by timestamp', () =>
                request.get(endpoint)
                    .then(res => {
                        res.status.should.equal(200);
                        res.body.data.recipes.length.should.equal(remainder);
                        res.body.data.recipes.should.deep.equal(sortedRecipes.slice((numPages - 1) * ITEMS_PER_PAGE));
                    })
            );

            it('should indicate that it is the last page', () => {
                request.get(endpoint)
                    .then(res => res.body.data.last_page.should.equal(true))
            });

            expectPageToBeConsistent();
        });

        describe('all valid page requests', () => {
            let pageIndices;
            before(() => {
                pageIndices = new Array(numPages).fill(0).map((_, idx) => idx);
            });

            it('should collectively return all recipes items sorted by timestamp', () =>
                Promise.all(pageIndices.map(pageIdx =>
                    request.get(`${endpoint}/${pageIdx}`)
                        .then(res => {
                            res.status.should.equal(200);
                            res.body.data.last_page.should.equal(pageIdx === numPages - 1);
                            res.body.data.recipes.length.should.equal(pageIdx === numPages - 1 ? remainder : ITEMS_PER_PAGE);
                            return res.body.data.recipes;
                        })
                ))
                    .then(pages => pages.reduce((a, b) => a.concat(b)))
                    .then(returned => returned.should.deep.equal(sortedRecipes))
            );
        });

        describe('page is too high', () => {
            beforeEach(() => {
                const pageIdx = Math.ceil(database.getAllRecords(DBStructure.models.Recipe).length / ITEMS_PER_PAGE) + 1;
                endpoint = `${endpoint}/${pageIdx}`
            });

            it('should return an OK response', () =>
                request.get(endpoint).then(res => res.status.should.equal(200))
            );

            it('should return an empty recipe list', () =>
                request.get(endpoint).then(res => res.body.data.recipes.should.deep.equal([]))
            );

            it('should return an empty recipe list', () =>
                request.get(endpoint).then(res => res.body.data.food.should.deep.equal([]))
            );

            it('should set last_page to true', () =>
                request.get(endpoint).then(res => res.body.data.last_page.should.equal(true))
            );

        });
    });
});


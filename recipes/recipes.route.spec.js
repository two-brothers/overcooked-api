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


describe('/recipes', () => {
    let server;
    before(() => {
        server = require('../www');
    });


    let endpoint;
    let request;
    let data;

    beforeEach(() => {
        endpoint = '/recipes';
        request = chai.request(server);
        database.reset();
    });

    describe('POST', () => {
        const initial_timestamp = Date.now();
        let recipe;

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
                        res.body.data.last_updated.should.be.greaterThan(initial_timestamp);
                        res.body.data.last_updated.should.be.lessThan(Date.now());
                        delete res.body.data.last_updated;

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
                expectNewRecipeResponse();
            });
        };

        /**
         * Uses the 'setter' function to set the value of a property in 'data' to confirm that:
         *   - 'expectBadPostRequest' is successful when the property is not a positive number
         *   - 'expectNewFoodResponse' is successful when the property is a positive number
         */
        const positiveNumberTests = (setter) => {
            describe('is a string', () => {
                beforeEach(() => setter('Arbitrary string'));
                expectBadPostRequest();
            });

            describe('is a negative number', () => {
                beforeEach(() => setter(-1));
                expectBadPostRequest();
            });

            describe('is zero', () => {
                beforeEach(() => setter(0));
                expectBadPostRequest();
            });

            describe('is one', () => {
                beforeEach(() => setter(1));
                expectNewRecipeResponse();
            });

            describe('is another positive integer', () => {
                beforeEach(() => setter(2));
                expectNewRecipeResponse();
            });

            describe('is a positive fraction', () => {
                beforeEach(() => setter(2.4));
                expectNewRecipeResponse();
            });
        };

        /**
         * Uses the 'setter' function to set the value of a property in 'data' to confirm that:
         *   - 'expectBadPostRequest' is successful when the property is not an integer bounded as specified
         *   - 'expectNewFoodResponse' is successful when the property is an integer bounded as specified
         * This function assumes lowerBound and upperBound have been set to integers
         */
        const boundIntegerTests = (lowerBound, upperBound, setter) => {
            describe('is a string', () => {
                beforeEach(() => setter('Arbitrary string'));
                expectBadPostRequest();
            });

            describe('is less than the lower bound', () => {
                beforeEach(() => setter(lowerBound - 1));
                expectBadPostRequest();
            });

            describe('is equal to the lower bound', () => {
                beforeEach(() => setter(lowerBound));
                expectNewRecipeResponse();
            });

            describe('is an integer in the middle of the specified range', () => {
                beforeEach(() => setter(Math.floor(lowerBound + upperBound) / 2));
                expectNewRecipeResponse();
            });

            describe('is equal to the upper bound', () => {
                beforeEach(() => setter(upperBound));
                expectNewRecipeResponse();
            });

            describe('is more than the upper bound', () => {
                beforeEach(() => setter(upperBound + 1));
                expectBadPostRequest();
            });

            describe('is not an integer', () => {
                beforeEach(() => setter(lowerBound + 0.3));
                expectBadPostRequest();
            });
        };

        /**
         * Uses the 'setter' function to set the value of a property in 'data' to confirm that:
         *   - 'expectBadPostRequest' is successful when the property is not a food id
         *   - 'expectNewFoodResponse' is successful when the property is a food id
         */
        const foodIDTests = (setter) => {
            describe('is a number', () => {
                beforeEach(() => setter(0));
                expectBadPostRequest();
            });

            describe('is an empty string', () => {
                beforeEach(() => setter(''));
                expectBadPostRequest();
            });

            describe('is an non food id string', () => {
                beforeEach(() => setter('Arbitrary string'));
                expectBadPostRequest();
            });

            describe('is a food id', () => {
                beforeEach(() => setter(foodRecords[0].id));
                expectNewRecipeResponse();
            });
        };

        beforeEach(() => {
            // recipe = recipeRecords[0];
            // data = recipe;
        });

        describe('the recipe title', () => {
            describe('is not defined', () => {
                beforeEach(() => {
                    delete recipe.title;
                });

                expectBadPostRequest();
            });

            nonEmptyStringTests((val) => {
                recipe.title = val;
            });
        });

        describe('the recipe serves property is not defined', () => {
            beforeEach(() => {
                if (recipe.serves) {
                    delete recipe.serves;
                }
            });

            describe('and the recipe makes property', () => {
                describe('is not defined', () => {
                    beforeEach(() => {
                        if (recipe.makes) {
                            delete recipe.makes;
                        }
                    });

                    expectBadPostRequest();
                });

                positiveNumberTests((val) => {
                    recipe.makes = val;
                });
            });
        });

        describe('the recipe makes property is not defined', () => {
            beforeEach(() => {
                if (recipe.makes) {
                    delete recipe.makes;
                }
            });

            describe('and the recipe serves property', () => {
                describe('is not defined', null); // already tested

                positiveNumberTests((val) => {
                    recipe.serves = val;
                });
            });
        });

        describe('the recipes serves and makes properties are both defined', () => {
            beforeEach(() => {
                recipe.serves = 3;
                recipe.makes = 9
            });

            expectBadPostRequest();
        });

        describe('the recipe prep_time', () => {
            positiveNumberTests((val) => {
                recipe.prep_time = val;
            });
        });

        describe('the recipe cook_time', () => {
            positiveNumberTests((val) => {
                recipe.cook_time = val;
            });
        });

        describe('the recipe ingredient_sections', () => {
            describe('is not defined', () => {
                beforeEach(() => {
                    delete recipe.ingredient_sections;
                });

                expectBadPostRequest();
            });

            describe('is a string', () => {
                beforeEach(() => {
                    recipe.ingredient_sections = 'Arbitrary string';
                });

                expectBadPostRequest();
            });

            describe('is an empty array', () => {
                beforeEach(() => {
                    recipe.ingredient_sections = [];
                });

                expectBadPostRequest();
            });

            describe('is an array where', () => {
                let section;

                /**
                 * Manipulates the 'section' property and ensures the appropriate response is
                 * returned from the endpoint
                 */
                const sectionTests = () => {
                    describe('heading', () => {
                        describe('is not defined', () => {
                            beforeEach(() => {
                                if (section.heading) {
                                    delete section.heading;
                                }
                            });

                            expectNewRecipeResponse();
                        });

                        nonEmptyStringTests((val) => {
                            section.heading = val;
                        });
                    });

                    describe('ingredients', () => {
                        describe('is not defined', () => {
                            beforeEach(() => {
                                delete section.ingredients;
                            });

                            expectBadPostRequest();
                        });


                        describe('is a string', () => {
                            beforeEach(() => {
                                section.ingredients = 'Arbitrary string';
                            });

                            expectBadPostRequest();
                        });

                        describe('is an empty array', () => {
                            beforeEach(() => {
                                section.ingredients = [];
                            });

                            expectBadPostRequest();
                        });

                        describe('is an array where', () => {
                            let ingredient;

                            const ingredientTests = () => {
                                describe('amount', () => {
                                    positiveNumberTests((val) => {
                                        ingredient.amount = val;
                                    });
                                });

                                describe('unit_id', () => {
                                    boundIntegerTests(0, MaxUnitType, (val) => {
                                        ingredient.unit_id = val;
                                    })
                                });

                                describe('food_id', () => {
                                    foodIDTests((val) => {
                                        ingredient.food_id = val;
                                    });
                                });
                            };

                            describe('the first ingredient', () => {
                                beforeEach(() => {
                                    ingredient = section.ingredients[0];
                                });

                                ingredientTests();
                            });

                            describe('the last ingredient', () => {
                                beforeEach(() => {
                                    ingredient = section.ingredients[section.ingredients.length - 1];
                                });

                                ingredientTests();
                            });
                        });
                    });
                };

                describe('the first section', () => {
                    beforeEach(() => {
                        section = recipe.ingredient_sections[0]
                    });

                    sectionTests();
                });

                describe('the last section', () => {
                    beforeEach(() => {
                        section = recipe.ingredient_sections[recipe.ingredient_sections.length - 1];
                    });

                    sectionTests();
                });
            });
        });

        describe('the recipe method', () => {
            describe('is not defined', () => {
                beforeEach(() => {
                    delete recipe.method;
                });

                expectBadPostRequest();
            });

            describe('is a string', () => {
                beforeEach(() => {
                    recipe.method = 'Arbitrary string';
                });

                expectBadPostRequest();
            });

            describe('is an empty array', () => {
                beforeEach(() => {
                    recipe.method = [];
                });

                expectBadPostRequest();
            });

            describe('is an array where', () => {

                describe('the first step', () => {
                    nonEmptyStringTests((val) => {
                        recipe.method[0] = val;
                    });
                });

                describe('the last step', () => {
                    nonEmptyStringTests((val) => {
                        recipe.method[recipe.method.length - 1] = val;
                    });
                });
            });
        });

        describe('the recipe reference url', () => {
            nonEmptyStringTests((val) => {
                recipe.reference_url = val;
            });
        });
    });

    describe.only('/:id', () => {
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
            const validFoodId = database.getAllRecords(DBStructure.models.Food)[0].id;

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

            const optional = Enumerator.scenario.presence.optional;
            const required = Enumerator.scenario.presence.required;
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

            const foodID = [
                new Enumerator.custom.simple('is an integer', 1, false),
                new Enumerator.custom.simple('is an empty string', '', false),
                new Enumerator.custom.simple('is not a valid food id', 'invalid_id', false),
                new Enumerator.custom.simple('is a valid id', validFoodId, true)
            ];

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

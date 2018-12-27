'use strict';

const Recipe = require('./recipe.model');
const RecipesSample = require('./recipe.sample');
const Enumerator = require('../bdd-enumerator/module');
const EnumeratorUtil = require('../enumerator-utility');
const MaxUnitType = require('../food/module').unit_types.length - 1;

const {
    property, object, nonEmptyString, nonEmptyArray,
    xorProperties, presence, finitePositiveNumber, boundedInteger
} = Enumerator.scenario;
const {dependent, simple} = Enumerator.custom;
const {allowNumbers, allowNumericStrings, allowStrings, simplifiedNonEmptyArray} = EnumeratorUtil;

const randomHexString = (numChars) => {
    let result = '';
    while (result.length < numChars) {
        result += Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16);
    }
    return result.slice(0, numChars);
};

describe('Recipe Model', () => {

    const validID = randomHexString(24);

    const foodIDScenarios = [
        new simple('is an integer', 1, false),
        new simple('is a string of an integer', '1', false),
        new simple('is an empty string', '', false),
        new simple('is a malformed food id', 'MALFORMED_FOOD_ID', false),
        new simple('is a valid id', validID, true)
    ];

    let specification;

    beforeEach(() => {
        // base the modifications off a valid Recipe object
        specification = JSON.parse(JSON.stringify(RecipesSample[0]));
        // the sample recipes have Food ID indices instead of Food IDs. Replace them with a valid (in structure) ID
        specification.ingredient_sections.map(sections => sections.ingredients.map(ingredient => {
            ingredient.food_id = validID
        }));
    });

    const expectValid = () =>
        it('should validate successfully', () => (new Recipe(specification)).validate());

    const RecordIncorrectlyValidated = new Error('An invalid record passed validation');
    const expectInvalid = () =>
        it('should fail to validate', () =>
            (new Recipe(specification)).validate()
                .then(() => {
                    throw RecordIncorrectlyValidated;
                })
                .catch(err => {
                    if (err === RecordIncorrectlyValidated) {
                        throw err;
                    } // otherwise suppress the expected error
                })
        );

    // the property under test is added directly to the specification object
    const baseObjFn = () => specification;

    const title = property('title', baseObjFn, presence.required(allowNumbers(nonEmptyString)));

    const makesAndServes = xorProperties(
        baseObjFn,
        new dependent('makes', presence.optional(allowNumericStrings(finitePositiveNumber))),
        new dependent('serves', presence.optional(allowNumericStrings(finitePositiveNumber)))
    );

    const prepTime = property('prep_time', baseObjFn, presence.required(allowNumericStrings(finitePositiveNumber)));
    const cookTime = property('cook_time', baseObjFn, presence.required(allowNumericStrings(finitePositiveNumber)));

    const ingredient_sections = property('ingredient_sections', baseObjFn,
        presence.required(simplifiedNonEmptyArray(
            object([
                new dependent('heading', presence.optional(allowNumbers(nonEmptyString))),
                new dependent('ingredients', presence.required(simplifiedNonEmptyArray(
                    object([
                        new dependent('amount', presence.required(allowNumericStrings(finitePositiveNumber))),
                        new dependent('unit_id', presence.required(allowNumericStrings(boundedInteger(0, MaxUnitType)))),
                        new dependent('food_id', presence.required(foodIDScenarios))
                    ])
                    ))
                )
            ])
        ))
    );

    const method = property('method', baseObjFn, presence.required(
        allowStrings(allowNumbers(nonEmptyArray(allowNumbers(nonEmptyString)))))
    );
    const reference_url = property('reference_url', baseObjFn, presence.required(allowNumbers(nonEmptyString)));
    const image_url = property('image_url', baseObjFn, presence.required(allowNumbers(nonEmptyString)));

    [title, makesAndServes, prepTime, cookTime, ingredient_sections, method, reference_url, image_url]
        .map(propertyScenario => Enumerator.enumerate(propertyScenario, expectValid, expectInvalid));
});



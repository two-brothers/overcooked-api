'use strict'

const Recipe = require('./recipe.model')
const RecipesSample = require('./recipe.sample')
const Enumerator = require('../bdd-enumerator/module')
const EnumeratorUtil = require('../enumerator-utility')
const MaxUnitType = require('../food/module').unitTypes.length - 1

const {
    property, object, nonEmptyString,
    xorProperties, presence, finitePositiveNumber, boundedInteger
} = Enumerator.scenario
const { dependent, simple } = Enumerator.custom
const { allowNumbers, allowNumericStrings, allowStrings, simplifiedNonEmptyArray } = EnumeratorUtil

const randomHexString = (numChars) => {
    let result = ''
    while (result.length < numChars) {
        result += Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)
    }
    return result.slice(0, numChars)
}

describe('Recipe Model', () => {

    const validID = randomHexString(24)

    const foodIDScenarios = [
        new simple('is an integer', 1, false),
        new simple('is a string of an integer', '1', false),
        new simple('is an empty string', '', false),
        new simple('is a malformed food id', 'MALFORMED_FOOD_ID', false),
        new simple('is a valid id', validID, true)
    ]

    let specification

    beforeEach(() => {
        // base the modifications off a valid Recipe object
        specification = JSON.parse(JSON.stringify(RecipesSample[0]))
        // the sample recipes have Food ID indices instead of Food IDs. Replace them with a valid (in structure) ID
        // they also store the ingredient type as integers (the way a client would see them) but our tests bypass
        // the pre-save hook, which means we need to replace them with the magic strings directly
        specification.ingredientSections.map(sections => sections.ingredients.map(ingredient => {
            if (ingredient.ingredientType === 0) {
                ingredient.foodId = validID
                ingredient.ingredientType = 'Quantified'
            } else {
                ingredient.ingredientType = 'FreeText'
            }
        }))
    })

    const expectValid = () =>
        it('should validate successfully', () => (new Recipe(specification)).validate())

    const RecordIncorrectlyValidated = new Error('An invalid record passed validation')
    const expectInvalid = () =>
        it('should fail to validate', () =>
            (new Recipe(specification)).validate()
                .then(() => {
                    throw RecordIncorrectlyValidated
                })
                .catch(err => {
                    if (err === RecordIncorrectlyValidated) {
                        throw err
                    } // otherwise suppress the expected error
                })
        )

    // the property under test is added directly to the specification object
    const baseObjFn = () => specification

    const title = property('title', baseObjFn, presence.required(allowNumbers(nonEmptyString)))

    const makesAndServes = xorProperties(
        baseObjFn,
        new dependent('makes', presence.optional(allowNumericStrings(finitePositiveNumber))),
        new dependent('serves', presence.optional(allowNumericStrings(finitePositiveNumber)))
    )

    const prepTime = property('prepTime', baseObjFn, presence.required(allowNumericStrings(finitePositiveNumber)))
    const cookTime = property('cookTime', baseObjFn, presence.required(allowNumericStrings(finitePositiveNumber)))


    const ingredientType = (ingType) => [
        new simple('is "Quantified"', 'Quantified', ingType === 0),
        new simple('is "FreeText"', 'FreeText', ingType === 1),
    ]
    // the scenarios for Quantified Ingredients
    const ingredient = object([
        new dependent('ingredientType', ingredientType(0)),
        new dependent('amount', presence.required(allowNumericStrings(finitePositiveNumber))),
        new dependent('unitIds', presence.required(simplifiedNonEmptyArray(allowNumericStrings(boundedInteger(0, MaxUnitType))))),
        new dependent('foodId', presence.required(foodIDScenarios)),
        new dependent('additionalDesc', presence.optional(allowNumbers(nonEmptyString)))
    ]) // the scenarios for FreeText Ingredients
        .concat(object([
            new dependent('ingredientType', ingredientType(1)),
            new dependent('description', presence.required(allowNumbers(nonEmptyString)))
        ]))
        // a scenario for an unknown ingredient type
        .concat(object([
            new dependent('ingredientType', [new simple('is "AnotherType"', 'AnotherType', false)])
        ]))

    const ingredientSections = property('ingredientSections', baseObjFn,
        presence.required(simplifiedNonEmptyArray(
            object([
                new dependent('heading', presence.optional(allowNumbers(nonEmptyString))),
                new dependent('ingredients', presence.required(simplifiedNonEmptyArray(ingredient)))
            ])
        ))
    )

    const method = property('method', baseObjFn, presence.required(
        allowStrings(allowNumbers(simplifiedNonEmptyArray(allowNumbers(nonEmptyString)))))
    )
    const referenceUrl = property('referenceUrl', baseObjFn, presence.required(allowNumbers(nonEmptyString)))
    const imageUrl = property('imageUrl', baseObjFn, presence.required(allowNumbers(nonEmptyString)));

    [title, makesAndServes, prepTime, cookTime, ingredientSections, method, referenceUrl, imageUrl]
        .map(propertyScenario => Enumerator.enumerate(propertyScenario, expectValid, expectInvalid))
})

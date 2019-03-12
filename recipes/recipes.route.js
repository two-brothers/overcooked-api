'use strict'

const express = require('express')
const router = express.Router()
const Recipe = require('./recipe.model')
const Food = require('../food/module').model
const UnitTypes = require('../food/module').unitTypes
const wrapper = require('../response-wrapper')
const VLD = require('../request-validator')
const auth = require('../auth/module')
// use a thunk so it can be mocked in unit tests
// even if the module is already initialised (for example, by being imported in another file)
const ensureAuth = (req, res, next) => auth.ensureAuth(req, res, next)

/**
 * Create a 'wrap' function that wraps the response
 * in a json object with a 'data' field before responding
 * to the client
 */
router.use((req, res, next) => {
    res.wrap = (response) => res.json(wrapper.wrap(response))
    return next()
})

/*** URI: /recipes ***/

/**
 * Create a new recipe
 */
router.post('/', ensureAuth, (req, res, next) => {
    const maxUnitType = UnitTypes.length - 1

    const error = VLD.firstError(
        VLD.required(req.body.title, VLD.isNonEmptyString, 'Recipe title must be a non-empty string'),
        VLD.optional(req.body.serves, VLD.isFinitePositiveNumber, 'Recipe serves (if defined) must be a positive number'),
        VLD.optional(req.body.makes, VLD.isFinitePositiveNumber, 'Recipe makes (if defined) must be a positive number'),
        VLD.mutuallyExclusive([req.body.makes, req.body.serves], 'Recipe serves xor makes must be defined'),
        VLD.required(req.body.prepTime, VLD.isFinitePositiveNumber, 'Recipe prepTime must be a positive number'),
        VLD.required(req.body.cookTime, VLD.isFinitePositiveNumber, 'Recipe cookTime must be a positive number'),
        VLD.required(req.body.ingredientSections, VLD.isNonEmptyArray, 'Recipe ingredientSections must be a non-empty array'),
        () => VLD.firstError(...req.body.ingredientSections.map((section, secIdx) => () => VLD.firstError(
            VLD.optional(section.heading, VLD.isNonEmptyString, `Recipe ingredientSections[${secIdx}].heading (if it exists) must be a non-empty string`),
            VLD.required(section.ingredients, VLD.isNonEmptyArray, `Recipe ingredientSections[${secIdx}].ingredients must be a non-empty array`),
            () => VLD.firstError(...section.ingredients.map((ingredient, ingIdx) => () => VLD.firstError(
                VLD.required(ingredient.ingredientType, VLD.isBoundedInt(0, 1), `Recipe ingredientSections[${secIdx}].ingredients[${ingIdx}].ingredientType must be either 0 or 1`),
                ingredient.ingredientType === 0 ?
                    () => VLD.firstError(
                        VLD.required(ingredient.amount, VLD.isFinitePositiveNumber, `Recipe ingredientSections[${secIdx}].ingredients[${ingIdx}].amount must be a positive number`),
                        VLD.required(ingredient.unitIds, VLD.isNonEmptyArray, `Recipe ingredientSections[${secIdx}].ingredients[${ingIdx}].unitIds must be a non-empty array`),
                        () => VLD.firstError(...ingredient.unitIds.map((unitId, unitIdIdx) =>
                            VLD.required(unitId, VLD.isBoundedInt(0, maxUnitType), `Recipe ingredientSections[${secIdx}].ingredients[${ingIdx}].unitId[${unitIdIdx}] must be an integer between 0 and ${maxUnitType}`)
                        )),
                        VLD.required(ingredient.foodId, VLD.isNonEmptyString, `Recipe ingredientSections[${secIdx}].ingredients[${ingIdx}].foodId must be a non-empty string`),
                        VLD.optional(ingredient.additionalDesc, VLD.isNonEmptyString, `Recipe ingredientSections[${secIdx}].ingredients[${ingIdx}].additionalDesc (if defined) must be a non-empty string`)
                    ) :
                    VLD.required(ingredient.description, VLD.isNonEmptyString, `Recipe ingredientSections[${secIdx}].ingredients[${ingIdx}].description must be a non-empty string`)
            )))
        ))),
        VLD.required(req.body.method, VLD.isNonEmptyArray, 'Recipe method must be a non-empty array'),
        () => VLD.firstError(...req.body.method.map((step, stepIdx) =>
            VLD.required(step, VLD.isNonEmptyString, `Recipe method[${stepIdx}] must be a non-empty string`)
        )),
        VLD.required(req.body.referenceUrl, VLD.isNonEmptyString, 'Recipe referenceUrl must be a non-empty string'),
        VLD.required(req.body.imageUrl, VLD.isNonEmptyString, 'Recipe imageUrl must be a non-empty string')
    )

    if (error) {
        return next({ status: 400, message: error })
    }

    Promise.all(
        // find any invalid ids
        req.body.ingredientSections.map(section => section.ingredients)
            .reduce((a, b) => a.concat(b))
            .map(ingredient => ingredient.foodId)
            .filter((food, idx, arr) => arr.indexOf(food) === idx)
            .map(id => Food.findOne({ _id: id })
                .then(record => record ? null : id)
                .catch(() => id)
            )
    )
        .then(invalidIds => invalidIds.filter(v => v))
        .then(invalidIds => {
            if (invalidIds.length > 0)
                return next({ status: 400, message: `Invalid food ids: ${invalidIds.join(';')}` })

            mapIngredientTypes(req.body.ingredientSections)
            return Recipe.create(req.body)
                .then(record => res.wrap(record.exportable))
        })
        .catch(() => next({ status: 500, message: 'Server Error: Unable to create the Recipe' }))
})

/*** URI /recipes/:id ***/

/**
 * Return the specified recipe and the required food items
 */
router.get('/:id', (req, res, next) => {
    const RecordNotFound = new Error('Record Not Found')

    Recipe.findOne({ _id: req.params.id })
        .catch(() => Promise.reject(RecordNotFound))
        .then(record => record ? record : Promise.reject(RecordNotFound))
        .then(recipe => recipe.exportable)
        .then(recipe => {
            const foodIds =
                recipe.ingredientSections
                    .map(section => section.ingredients)
                    .reduce((a, b) => a.concat(b))
                    .filter(ingredient => ingredient.ingredientType === 0)
                    .map(ingredient => ingredient.foodId)
                    .filter((foodId, idx, arr) => arr.indexOf(foodId) === idx)

            Promise.all(foodIds.map(id =>
                // ignore any food items not in the database
                Food.findOne({ _id: id })
                    .catch(() => null)
                    .then(food => food ? food.exportable : null)
            ))
                .then(foods => foods.filter(v => v))
                // convert the array into an object
                .then(foods => foods.reduce((obj, food) => ({ ...obj, [food.id]: food }), {}))
                .then(foods => res.wrap({
                    recipe: recipe,
                    food: foods
                }))
        })
        .catch(err => err === RecordNotFound ?
            next() : // let the 404 handler catch it
            next({ status: 500, message: 'Server Error: Unable to retrieve the Recipe' })
        )
})

/**
 * Update the specified recipe
 */
router.put('/:id', ensureAuth, (req, res, next) => {
    const RecordNotFound = new Error('Record Not Found')
    const maxUnitType = UnitTypes.length - 1

    const error = VLD.firstError(
        VLD.optional(req.body.title, VLD.isNonEmptyString, 'Recipe title (if defined) must be a non-empty string'),
        VLD.optional(req.body.serves, VLD.isFinitePositiveNumber, 'Recipe serves (if defined) must be a positive number'),
        VLD.optional(req.body.makes, VLD.isFinitePositiveNumber, 'Recipe makes (if defined) must be a positive number'),
        () => [req.body.makes, req.body.serves].every(val => val !== undefined) && 'Recipe serves and makes cannot both be defined',
        VLD.optional(req.body.prepTime, VLD.isFinitePositiveNumber, 'Recipe prepTime (if defined) must be a positive number'),
        VLD.optional(req.body.cookTime, VLD.isFinitePositiveNumber, 'Recipe cookTime (if defined) must be a positive number'),
        VLD.optional(req.body.ingredientSections, VLD.isNonEmptyArray, 'Recipe ingredientSections (if defined) must be a non-empty array'),
        () => req.body.ingredientSections && VLD.firstError(...req.body.ingredientSections.map((section, secIdx) => () => VLD.firstError(
            VLD.optional(section.heading, VLD.isNonEmptyString, `Recipe ingredientSections[${secIdx}].heading (if it exists) must be a non-empty string`),
            VLD.required(section.ingredients, VLD.isNonEmptyArray, `Recipe ingredientSections[${secIdx}].ingredients must be a non-empty array`),
            () => VLD.firstError(...section.ingredients.map((ingredient, ingIdx) => () => VLD.firstError(
                VLD.required(ingredient.ingredientType, VLD.isBoundedInt(0, 1), `Recipe ingredientSections[${secIdx}].ingredients[${ingIdx}].ingredientType must be either 0 or 1`),
                ingredient.ingredientType === 0 ?
                    () => VLD.firstError(
                        VLD.required(ingredient.amount, VLD.isFinitePositiveNumber, `Recipe ingredientSections[${secIdx}].ingredients[${ingIdx}].amount must be a positive number`),
                        VLD.required(ingredient.unitIds, VLD.isNonEmptyArray, `Recipe ingredientSections[${secIdx}].ingredients[${ingIdx}].unitIds must be a non-empty array`),
                        () => VLD.firstError(...ingredient.unitIds.map((unitId, unitIdIdx) =>
                            VLD.required(unitId, VLD.isBoundedInt(0, maxUnitType), `Recipe ingredientSections[${secIdx}].ingredients[${ingIdx}].unitId[${unitIdIdx}] must be an integer between 0 and ${maxUnitType}`)
                        )),
                        VLD.required(ingredient.foodId, VLD.isNonEmptyString, `Recipe ingredientSections[${secIdx}].ingredients[${ingIdx}].foodId must be a non-empty string`),
                        VLD.optional(ingredient.additionalDesc, VLD.isNonEmptyString, `Recipe ingredientSections[${secIdx}].ingredients[${ingIdx}].additionalDesc (if defined) must be a non-empty string`)
                    ) :
                    VLD.required(ingredient.description, VLD.isNonEmptyString, `Recipe ingredientSections[${secIdx}].ingredients[${ingIdx}].description must be a non-empty string`)
            )))
        ))),
        VLD.optional(req.body.method, VLD.isNonEmptyArray, 'Recipe method (if defined) must be a non-empty array'),
        () => req.body.method && VLD.firstError(...req.body.method.map((step, stepIdx) =>
            VLD.required(step, VLD.isNonEmptyString, `Recipe method[${stepIdx}] must be a non-empty string`)
        )),
        VLD.optional(req.body.referenceUrl, VLD.isNonEmptyString, 'Recipe referenceUrl (if defined) must be a non-empty string'),
        VLD.optional(req.body.imageUrl, VLD.isNonEmptyString, 'Recipe imageUrl (if defined) must be a non-empty string')
    )

    if (error)
        return next({ status: 400, message: error })

    Promise.all(
        // find any invalid ids
        req.body.ingredientSections !== undefined ?
            req.body.ingredientSections
                .map(section => section.ingredients)
                .reduce((a, b) => a.concat(b))
                .filter(ingredient => ingredient.ingredientType === 0)
                .map(ingredient => ingredient.foodId)
                .filter((food, idx, arr) => arr.indexOf(food) === idx)
                .map(id => // save the invalid ids
                    Food.findOne({ _id: id })
                        .then(record => record ? null : id)
                        .catch(() => id)
                ) : []
    )
        .then(invalidIds => invalidIds.filter(v => v))
        .then(invalidIds => {
            if (invalidIds.length > 0)
                return next({ status: 400, message: `Invalid food ids: ${invalidIds.join(';')}` })

            if (req.body.ingredientSections) {
                mapIngredientTypes(req.body.ingredientSections)
            }
            return Recipe.findOne({ _id: req.params.id })
                .catch(() => Promise.reject(RecordNotFound))
                .then(record => record ? record : Promise.reject(RecordNotFound))
                .then(recipe => Object.assign(recipe, req.body))
                .then(recipe => {
                    if (recipe.serves !== undefined && recipe.makes !== undefined) {
                        if (req.body.serves !== undefined)
                            recipe.makes = undefined
                        else {
                            recipe.serves = undefined
                        }
                    }
                    return recipe
                })
                .then(recipe => recipe.save())
                .then(() => res.status(204).send())
        })
        .catch(err => err === RecordNotFound ?
            next() : // let the 404 handler catch it
            next({ status: 500, message: 'Server Error: Unable to update the specified Recipe' })
        )
})

/**
 * Delete the specified recipe
 */
router.delete('/:id', ensureAuth, (req, res, next) => {
    const RecordNotFound = new Error('Record Not Found')

    Recipe.findOne({ _id: req.params.id })
        .catch(() => Promise.reject(RecordNotFound))
        .then(record => record ? record : Promise.reject(RecordNotFound))
        .then(record => record.remove())
        .then(() => res.status(204).send())
        .catch(err => err === RecordNotFound ?
            next() : // let the 404 handler catch it
            next({ status: 500, message: 'Server Error: Unable to delete the specified recipe' })
        )
})

/*** URI: /recipes/at/:page ***/

router.get('/at/:page', (req, res, next) => {
    const ITEMS_PER_PAGE = 10

    const page = Number(req.params.page)
    const error = VLD.required(page, VLD.isBoundedInt(0, Infinity), 'The page parameter must be a non-negative integer')()
    if (error)
        return next({ status: 400, message: error })

    Recipe.find()
        .sort({ updatedAt: -1 })
        .limit(ITEMS_PER_PAGE + 1) // get an extra record to see if there is at least another page
        .skip(page * ITEMS_PER_PAGE)
        .then(recipes => recipes.map(recipe => recipe.exportable))
        .then(recipes => {
            const lastPage = recipes.length <= ITEMS_PER_PAGE
            recipes = recipes.slice(0, ITEMS_PER_PAGE)

            const foodIds = recipes.length === 0 ?
                [] :
                recipes.map(recipe => recipe.ingredientSections)
                    .reduce((a, b) => a.concat(b))
                    .map(section => section.ingredients)
                    .reduce((a, b) => a.concat(b))
                    .filter(ingredient => ingredient.ingredientType === 0)
                    .map(ingredient => ingredient.foodId)
                    .filter((foodId, idx, arr) => arr.indexOf(foodId) === idx)

            Promise.all(foodIds.map(id =>
                // ignore any food items not in the database
                Food.findOne({ _id: id })
                    .catch(() => null)
                    .then(food => food ? food.exportable : null)
            ))
                .then(foods => foods.filter(v => v))
                // convert the array into an object
                .then(foods => foods.reduce((obj, food) => ({ ...obj, [food.id]: food }), {}))
                .then(foods => res.wrap({
                    recipes: recipes,
                    food: foods,
                    lastPage: lastPage
                }))
        })
        .catch(() => next({ status: 500, message: 'Server Error: Unable to retrieve the specified recipes' }))
})

/**
 * Convert the ingredientTypes to the corresponding magic strings used as DB discriminators
 * Note: this modifies the ingredient sections in place
 */
const mapIngredientTypes = (sections) => {
    sections.map(section => section.ingredients.map(ingredient => {
        ingredient.ingredientType = ingredient.ingredientType === 0 ? 'Quantified' : 'FreeText'
    }))
}

module.exports = router

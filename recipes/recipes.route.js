'use strict';

const express = require('express');
const router = express.Router();
const Recipe = require('./recipe.model');
const Food = require('../food/module').model;
const UnitTypes = require('../food/module').unit_types;
const wrapper = require('../response-wrapper');
const VLD = require('../request-validator');
const auth = require('../auth/module');
// use a thunk so it can be mocked in unit tests
// even if the module is already initialised (for example, by being imported in another file)
const ensureAuth = (req, res, next) => auth.ensureAuth(req, res, next);

/**
 * Create a 'wrap' function that wraps the response
 * in a json object with a 'data' field before responding
 * to the client
 */
router.use((req, res, next) => {
    res.wrap = (response) => res.json(wrapper.wrap(response));
    return next();
});

/*** URI: /recipes ***/

/**
 * Create a new recipe
 */
router.post('/', ensureAuth, (req, res, next) => {
    const maxUnitType = UnitTypes.length - 1;

    const error = VLD.required(req.body.title, VLD.isNonEmptyString, 'Recipe title must be a non-empty string') ||
        VLD.optional(req.body.serves, VLD.isPositiveNumber, 'Recipe serves (if defined) must be a positive number') ||
        VLD.optional(req.body.makes, VLD.isPositiveNumber, 'Recipe makes (if defined) must be a positive number') ||
        VLD.mutuallyExclusive([req.body.makes, req.body.serves], 'Recipe serves xor makes must be defined') ||
        VLD.required(req.body.prep_time, VLD.isPositiveNumber, 'Recipe prep_time must be a positive number') ||
        VLD.required(req.body.cook_time, VLD.isPositiveNumber, 'Recipe cook_time must be a positive number') ||
        VLD.required(req.body.ingredient_sections, VLD.isNonEmptyArray, 'Recipe ingredient_sections must be a non-empty array') ||
        req.body.ingredient_sections.reduce((error, section, secIdx) => error || (
            VLD.optional(section.heading, VLD.isNonEmptyString,
                `Recipe ingredient_sections[${secIdx}].heading (if it exists) must be a non-empty string`) ||
            VLD.required(section.ingredients, VLD.isNonEmptyArray,
                `Recipe ingredient_sections[${secIdx}].ingredients must be a non-empty array`) ||
            section.ingredients.reduce((error, ingredient, ingIdx) => error || (
                VLD.required(ingredient.ingredient_type, VLD.isOneOf('Quantified', 'FreeText')) ||
                ingredient.ingredient_type === 'Quantified' ?
                    (
                        VLD.required(ingredient.amount, VLD.isPositiveNumber,
                            `Recipe ingredient_sections[${secIdx}].ingredients[${ingIdx}].amount must be a positive number`) ||
                        VLD.required(ingredient.unit_ids, VLD.isNonEmptyArray,
                            `Recipe ingredient_sections[${secIdx}].ingredients[${ingIdx}].unit_ids must be a non-empty array`) ||
                        ingredient.unit_ids.reduce((error, unit_id, uidIdx) => error ||
                            VLD.required(unit_id, VLD.isBoundedInt(0, maxUnitType),
                                `Recipe ingredient_sections[${secIdx}].ingredients[${ingIdx}].unit_id[${uidIdx}] must be an integer between 0 and ${maxUnitType}`
                            ), null) ||
                        VLD.required(ingredient.food_id, VLD.isNonEmptyString,
                            `Recipe ingredient_sections[${secIdx}].ingredients[${ingIdx}].food_id must be a non-empty string`) ||
                        VLD.optional(ingredient.additional_desc, VLD.isNonEmptyString,
                            `Recipe ingredient_sections[${secIdx}].ingredients[${ingIdx}].additional_desc (if defined) must be a non-empty string`)
                    ) :
                    VLD.required(ingredient.description, VLD.isNonEmptyString,
                        `Recipe ingredient_sections[${secIdx}].ingredients[${ingIdx}].description must be a non-empty string`)
            ), null)
        ), null) ||
        VLD.required(req.body.method, VLD.isNonEmptyArray, 'Recipe method must be a non-empty array') ||
        req.body.method.reduce((error, step, stepIdx) => error ||
            VLD.required(step, VLD.isNonEmptyString, `Recipe method[${stepIdx}] must be a non-empty string`),
            null) ||
        VLD.required(req.body.reference_url, VLD.isNonEmptyString, 'Recipe reference_url must be a non-empty string') ||
        VLD.required(req.body.image_url, VLD.isNonEmptyString, 'Recipe image_url must be a non-empty string');

    if (error) {
        return next({status: 400, message: error});
    }

    Promise.all(
        // find any invalid ids
        req.body.ingredient_sections.map(section => section.ingredients)
            .reduce((a, b) => a.concat(b))
            .map(ingredient => ingredient.food_id)
            .filter((food, idx, arr) => arr.indexOf(food) === idx)
            .map(id => Food.findOne({_id: id})
                .then(record => record ? null : id)
                .catch(() => id)
            )
    )
        .then(invalid_ids => invalid_ids.filter(v => v))
        .then(invalid_ids => {
            if (invalid_ids.length > 0)
                return next({status: 400, message: `Invalid food ids: ${invalid_ids.join(';')}`});

            mapIngredientTypes(req.body.ingredientSections);
            return Recipe.create(req.body)
                .then(record => res.wrap(record.exportable));
        })
        .catch(() => next({status: 500, message: 'Server Error: Unable to create the Recipe'}));
});

/*** URI /recipes/:id ***/

/**
 * Return the specified recipe and the required food items
 */
router.get('/:id', (req, res, next) => {
    const RecordNotFound = new Error('Record Not Found');

    Recipe.findOne({_id: req.params.id})
        .catch(() => Promise.reject(RecordNotFound))
        .then(record => record ? record : Promise.reject(RecordNotFound))
        .then(recipe => recipe.exportable)
        .then(recipe => {
            const food_ids =
                recipe.ingredient_sections
                    .map(section => section.ingredients)
                    .reduce((a, b) => a.concat(b))
                    .filter(ingredient => ingredient.ingredientType === 0)
                    .map(ingredient => ingredient.foodId)
                    .filter((foodId, idx, arr) => arr.indexOf(foodId) === idx);

            Promise.all(food_ids.map(id =>
                // ignore any food items not in the database
                Food.findOne({_id: id})
                    .catch(() => null)
                    .then(food => food ? food.exportable : null)
            ))
                .then(foods => foods.filter(v => v))
                .then(foods => res.wrap({
                    recipe: recipe,
                    food: foods
                }));
        })
        .catch(err => err === RecordNotFound ?
            next() : // let the 404 handler catch it
            next({status: 500, message: 'Server Error: Unable to retrieve the Recipe'})
        );
});

/**
 * Update the specified recipe
 */
router.put('/:id', ensureAuth, (req, res, next) => {
    const RecordNotFound = new Error('Record Not Found');
    const maxUnitType = UnitTypes.length - 1;

    const error = VLD.optional(req.body.title, VLD.isNonEmptyString, 'Recipe title (if defined) must be a non-empty string') ||
    VLD.optional(req.body.serves, VLD.isPositiveNumber, 'Recipe serves (if defined) must be a positive number') ||
    VLD.optional(req.body.makes, VLD.isPositiveNumber, 'Recipe makes (if defined) must be a positive number') ||
    ([req.body.serves, req.body.makes].every(val => val !== undefined)) ? 'Recipe serves and makes cannot both be defined' : null ||
        VLD.optional(req.body.prep_time, VLD.isPositiveNumber, 'Recipe prep_time (if defined) must be a positive number') ||
        VLD.optional(req.body.cook_time, VLD.isPositiveNumber, 'Recipe cook_time (if defined) must be a positive number') ||
        VLD.optional(req.body.ingredient_sections, VLD.isNonEmptyArray, 'Recipe ingredient_sections (if defined) must be a non-empty array') ||
        (req.body.ingredient_sections !== undefined ?
                req.body.ingredient_sections.reduce((error, section, secIdx) => error || (
                    VLD.optional(section.heading, VLD.isNonEmptyString,
                        `Recipe ingredient_sections[${secIdx}].heading (if it exists) must be a non-empty string`) ||
                    VLD.required(section.ingredients, VLD.isNonEmptyArray,
                        `Recipe ingredient_sections[${secIdx}].ingredients must be a non-empty array`) ||
                    section.ingredients.reduce((error, ingredient, ingIdx) => error || (
                        VLD.required(ingredient.ingredient_type, VLD.isOneOf('Quantified', 'FreeText')) ||
                        ingredient.ingredient_type === 'Quantified' ?
                            (
                                VLD.required(ingredient.amount, VLD.isPositiveNumber,
                                    `Recipe ingredient_sections[${secIdx}].ingredients[${ingIdx}].amount must be a positive number`) ||
                                VLD.required(ingredient.unit_ids, VLD.isNonEmptyArray,
                                    `Recipe ingredient_sections[${secIdx}].ingredients[${ingIdx}].unit_ids must be a non-empty array`) ||
                                ingredient.unit_ids.reduce((error, unit_id, uidIdx) => error ||
                                    VLD.required(unit_id, VLD.isBoundedInt(0, maxUnitType),
                                        `Recipe ingredient_sections[${secIdx}].ingredients[${ingIdx}].unit_id[${uidIdx}] must be an integer between 0 and ${maxUnitType}`
                                    ), null) ||
                                VLD.required(ingredient.food_id, VLD.isNonEmptyString,
                                    `Recipe ingredient_sections[${secIdx}].ingredients[${ingIdx}].food_id must be a non-empty string`) ||
                                VLD.optional(ingredient.additional_desc, VLD.isNonEmptyString,
                                    `Recipe ingredient_sections[${secIdx}].ingredients[${ingIdx}].additional_desc (if defined) must be a non-empty string`)
                            ) :
                            VLD.required(ingredient.description, VLD.isNonEmptyString,
                                `Recipe ingredient_sections[${secIdx}].ingredients[${ingIdx}].description must be a non-empty string`)
                    ), null)
                ), null) :
                null
        ) ||
        VLD.optional(req.body.method, VLD.isNonEmptyArray, 'Recipe method (if defined) must be a non-empty array') ||
        (req.body.method !== undefined ?
                req.body.method.reduce(
                    (error, step, stepIdx) => error ||
                        VLD.required(step, VLD.isNonEmptyString, `Recipe method[${stepIdx}] must be a non-empty string`),
                    null
                ) :
                null
        ) ||
        VLD.optional(req.body.reference_url, VLD.isNonEmptyString, 'Recipe reference_url (if defined) must be a non-empty string') ||
        VLD.optional(req.body.image_url, VLD.isNonEmptyString, 'Recipe image_url (if defined) must be a non-empty string');

    if (error)
        return next({status: 400, message: error});

    Promise.all(
        // find any invalid ids
        req.body.ingredient_sections !== undefined ?
            req.body.ingredient_sections
                .map(section => section.ingredients)
                .reduce((a, b) => a.concat(b))
                .filter(ingredient => ingredient.ingredientType === 0)
                .map(ingredient => ingredient.foodId)
                .filter((food, idx, arr) => arr.indexOf(food) === idx)
                .map(id => // save the invalid ids
                    Food.findOne({_id: id})
                        .then(record => record ? null : id)
                        .catch(() => id)
                ) : []
    )
        .then(invalid_ids => invalid_ids.filter(v => v))
        .then(invalid_ids => {
            if (invalid_ids.length > 0)
                return next({status: 400, message: `Invalid food ids: ${invalid_ids.join(';')}`});

            if (req.body.ingredientSections) {
                mapIngredientTypes(req.body.ingredientSections);
            }
            return Recipe.findOne({_id: req.params.id})
                .catch(() => Promise.reject(RecordNotFound))
                .then(record => record ? record : Promise.reject(RecordNotFound))
                .then(recipe => Object.assign(recipe, req.body))
                .then(recipe => {
                    if (recipe.serves !== undefined && recipe.makes !== undefined) {
                        if (req.body.serves !== undefined)
                            recipe.makes = undefined;
                        else {
                            recipe.serves = undefined;
                        }
                    }
                    return recipe;
                })
                .then(recipe => recipe.save())
                .then(() => res.status(204).send());
        })
        .catch(err => err === RecordNotFound ?
            next() : // let the 404 handler catch it
            next({status: 500, message: 'Server Error: Unable to update the specified Recipe'})
        );
});

/**
 * Delete the specified recipe
 */
router.delete('/:id', ensureAuth, (req, res, next) => {
    const RecordNotFound = new Error('Record Not Found');

    Recipe.findOne({_id: req.params.id})
        .catch(() => Promise.reject(RecordNotFound))
        .then(record => record ? record : Promise.reject(RecordNotFound))
        .then(record => record.remove())
        .then(() => res.status(204).send())
        .catch(err => err === RecordNotFound ?
            next() : // let the 404 handler catch it
            next({status: 500, message: 'Server Error: Unable to delete the specified recipe'})
        );
});

/*** URI: /recipes/at/:page ***/

router.get('/at/:page', (req, res, next) => {
    const ITEMS_PER_PAGE = 10;

    const page = Number(req.params.page);
    const error = VLD.required(page, VLD.isBoundedInt(0, Infinity), 'The page parameter must be a non-negative integer');
    if (error)
        return next({status: 400, message: error});

    Recipe.find()
        .sort({updatedAt: -1})
        .limit(ITEMS_PER_PAGE + 1) // get an extra record to see if there is at least another page
        .skip(page * ITEMS_PER_PAGE)
        .then(recipes => recipes.map(recipe => recipe.exportable))
        .then(recipes => {
            const last_page = recipes.length <= ITEMS_PER_PAGE;
            recipes = recipes.slice(0, ITEMS_PER_PAGE);

            const food_ids = recipes.length === 0 ?
                [] :
                recipes.map(recipe => recipe.ingredient_sections)
                    .reduce((a, b) => a.concat(b))
                    .map(section => section.ingredients)
                    .reduce((a, b) => a.concat(b))
                    .filter(ingredient => ingredient.ingredientType === 0)
                    .map(ingredient => ingredient.foodId)
                    .filter((foodId, idx, arr) => arr.indexOf(foodId) === idx);

            Promise.all(food_ids.map(id =>
                // ignore any food items not in the database
                Food.findOne({_id: id})
                    .catch(() => null)
                    .then(food => food ? food.exportable : null)
            ))
                .then(foods => foods.filter(v => v))
                .then(foods => res.wrap({
                    recipes: recipes,
                    food: foods,
                    lastPage: lastPage
                }));
        })
        .catch(() => next({status: 500, message: 'Server Error: Unable to retrieve the specified recipes'}));
});

/**
 * Convert the ingredientTypes to the corresponding magic strings used as DB discriminators
 * Note: this modifies the ingredient sections in place
 */
const mapIngredientTypes = (sections) => {
    sections.map(section => section.ingredients.map(ingredient => {
        ingredient.ingredientType = ingredient.ingredientType === 0 ? 'Quantified' : 'FreeText';
    }));
};

module.exports = router;

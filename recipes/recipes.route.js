'use strict';

const express = require('express');
const router = express.Router();
const Recipe = require('./recipe.model');
const Food = require('../food/module').model;
const wrapper = require('../response-wrapper');

/**
 * Create a 'wrap' function that wraps the response
 * in a json object with a 'data' field before responding
 * to the client
 */
router.use((req, res, next) => {
    res.wrap = (response) => res.json(wrapper.wrap(response));
    next();
});

/*** URI: /recipes ***/

/**
 * Create a new recipe
 */
router.post('/', (req, res, next) => {
    if (!req.body.title || typeof req.body.title !== 'string')
        return next({status: 400, message: 'Recipe title must be a string'});
    if (req.body.serves === undefined) {
        if (req.body.makes === undefined)
            return next({status: 400, message: 'Either serves or makes must be defined'});
        if (typeof req.body.makes !== 'number')
            return next({status: 400, message: 'makes must be a number'});
    } else {
        if (req.body.makes !== undefined)
            return next({status: 400, message: 'Both serves and makes cannot be defined'});
        if (typeof req.body.serves !== 'number')
            return next({status: 400, message: 'serves must be a number'});
    }
    if (req.body.prep_time === undefined || typeof req.body.prep_time !== 'number')
        return next({status: 400, message: 'Recipe prep_time must be a number'});
    if (req.body.cook_time === undefined || typeof req.body.cook_time !== 'number')
        return next({status: 400, message: 'Recipe cook_time must be a number'});
    if (!req.body.ingredient_sections || !Array.isArray(req.body.ingredient_sections))
        return next({status: 400, message: 'Recipe ingredient_sections must be an array'});
    req.body.ingredient_sections.forEach(section => {
        if (section.heading && typeof section.heading !== 'string')
            return next({status: 400, message: 'Each (optional) section heading (if it exists) must be a string'});
        if (!section.ingredients || !Array.isArray(section.ingredients))
            return next({status: 400, message: 'Each section.ingredients must be an array'});
        section.ingredients.forEach(ingredient => {
            if (ingredient.amount === undefined || typeof ingredient.amount !== 'number')
                return next({status: 400, message: 'Each ingredient.amount must be a number'});
            if (ingredient.unit_id === undefined || typeof ingredient.unit_id !== 'number' ||
                !Number.isInteger(ingredient.unit_id) || ingredient.unit_id < 0 || ingredient.unit_id > 12)
                return next({status: 400, message: 'Each ingredient.unit_id must be an integer between 0 and 12'});
            if (ingredient.alternative_unit_id !== undefined) {
                if (typeof ingredient.alternative_unit_id !== 'number' || !Number.isInteger(ingredient.alternative_unit_id)
                    || ingredient.alternative_unit_id < 0 || ingredient.alternative_unit_id > 12)
                    return next({
                        status: 400,
                        message: 'Each ingredient.alternative_unit_id (if it exists) must be an integer between 0 and 12'
                    });
            }
            if (ingredient.food_id === undefined || typeof ingredient.food_id !== 'string')
                return next({status: 400, message: 'Each ingredient.food_id must be a string'});
        });
    });
    if (!req.body.method || !Array.isArray(req.body.method))
        return next({Status: 400, message: 'Recipe method must be an array'});
    req.body.method.forEach(step => {
        if (typeof step !== 'string')
            return next({status: 400, message: 'Each step in the method must be a string'});
    });
    if (!req.body.reference_url || typeof req.body.reference_url !== 'string')
        return next({status: 400, message: 'The Recipe reference_url must be a string'});

    // confirm that all the food_id values exist in the database
    const food_id_promises = req.body.ingredient_sections.map(section => section.ingredients)
        .reduce((a, b) => a.concat(b))
        .map(ingredient => ingredient.food_id)
        .filter((food, idx, arr) => arr.indexOf(food) === idx)
        .map(id => // save the invalid ids
            Food.find({_id: id})
                .then(() => null)
                .catch(() => id)
        );

    Promise.all(food_id_promises)
        .then(invalid_ids => invalid_ids.filter(v => v))
        .then(invalid_ids => {
            if (invalid_ids.length > 0) {
                return next({status: 400, message: `Invalid food ids: ${invalid_ids.join(';')}`})
            }
            return Recipe.create(req.body)
                .then(record => res.wrap(record.exportable))
        })
        .catch(err => next({status: 500, message: 'Server Error: Unable to create the Recipe'}));
});

/*** URI /recipes/:id ***/

/**
 * Return the specified recipe and the required food items
 */
router.get('/:id', (req, res, next) => {
    Recipe.findOne({_id: req.params.id})
        .catch(() => next()) // let the 404 handler catch it
        .then(recipe => recipe.exportable)
        .then(recipe => {
            const food_ids =
                recipe.ingredient_sections
                    .map(section => section.ingredients)
                    .reduce((a, b) => a.concat(b))
                    .map(ingredient => ingredient.food_id)
                    .filter((food_id, idx, arr) => arr.indexOf(food_id) === idx);


            Promise.all(food_ids.map(id => Food.findOne({_id: id})
                .then(food => food.exportable)
            ))
                .then(foods => res.wrap({
                    recipe: recipe,
                    food: foods
                }))
        })
        .catch(err => next({status: 500, message: 'Server Error: Unable to retrieve the Recipe'}));
});

module.exports = router;
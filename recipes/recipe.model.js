'use strict';

const mongoose = require('mongoose');

const MaxUnitType = require('../food/module').unit_types.length - 1;

const isPositiveNumber = v => v > 0;
const isPopulated = arr => arr.length > 0;

/**
 * Each ingredient can have one of two different structures, depending on the ingredient type.
 */
const options = {discriminatorKey: 'ingredient_type', _id: false, strict: true};
const IngredientSchema = new mongoose.Schema({}, options);

const Recipe = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlength: 1
    },
    serves: {
        type: Number,
        required: function () {
            return this.makes === undefined;
        },
        validate: {
            validator: function (serves) {
                return this.makes !== undefined ? false : serves > 0;
            },
            message: 'serves should be defined iff makes is undefined and must be greater than zero'
        }
    },
    makes: {
        type: Number,
        required: function () {
            return this.serves === undefined;
        },
        validate: {
            validator: function (makes) {
                return this.serves !== undefined ? false : makes > 0;
            },
            message: 'makes should be defined iff serves is undefined and must be greater than zero'
        }
    },
    prep_time: {
        type: Number,
        required: true,
        validate: {
            validator: isPositiveNumber,
            message: 'prep_time must be greater than zero'
        }
    },
    cook_time: {
        type: Number,
        required: true,
        validate: {
            validator: isPositiveNumber,
            message: 'cook_time must be greater than zero'
        }
    },
    ingredient_sections: {
        type: [{
            _id: false,
            heading: {
                type: String,
                required: false,
                minlength: 1
            },
            ingredients: {
                type: [IngredientSchema],
                validate: {
                    validator: ingredients => ingredients.length > 0 &&
                        ingredients.map(ingredient => ['Quantified', 'FreeText'].includes(ingredient.ingredient_type))
                            .reduce((a, b) => a && b, true),
                    message: 'There must be at least one ingredient in every ingredient section, ' +
                        'and all ingredient types must be either "Quantified" or "FreeText"'
                }
            }
        }],
        validate: {
            validator: isPopulated,
            message: 'There must be at least one ingredient section'
        }
    },
    method: {
        type: [String],
        validate: {
            validator: method => method.length > 0 &&
                method.map(step => step.length > 0)
                    .reduce((a, b) => a && b, true),
            message: 'There must be at least one step in the method, and all steps must be non-empty strings'
        }
    },
    reference_url: {
        type: String,
        required: true
    },
    image_url: {
        type: String,
        required: true
    }
}, {timestamps: true});


Recipe.path('ingredient_sections').schema.path('ingredients').discriminator('Quantified', new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        validate: {
            validator: isPositiveNumber,
            message: 'ingredient amount must be greater than zero'
        }
    },
    unit_ids: {
        type: [{
            type: Number,
            required: true,
            min: 0,
            max: MaxUnitType,
            validate: {
                validator: Number.isInteger,
                message: 'Every unit ID must be an integer'
            }
        }],
        validate: {
            validator: isPopulated,
            message: 'There must be at least one unit id in every Quantified Ingredient'
        }
    },
    food_id: {
        type: mongoose.Schema.ObjectId,
        required: true
    },
    additional_desc: {
        type: String,
        required: false,
        minlength: 1
    }
}, {_id: false}));

Recipe.path('ingredient_sections').schema.path('ingredients').discriminator('FreeText', new mongoose.Schema({
    description: {
        type: String,
        required: true,
        minlength: 1
    }
}, {_id: false}));

Recipe.virtual('exportable')
    .get(function () {
        // Replace the 'Quantified' and 'FreeText' ingredient types with 0 and 1 respectively
        const ingSections = this.ingredient_sections.map(section => Object.assign(
            section.heading ? {heading: section.heading} : {},
            {
                ingredients: section.ingredients.map(ingredient => ingredient.ingredient_type === 'Quantified' ?
                    {
                        ingredient_type: 0,
                        amount: ingredient.amount,
                        unit_ids: ingredient.unit_ids,
                        food_id: ingredient.food_id,
                        additional_desc: ingredient.additional_desc
                    } :
                    {
                        ingredient_type: 1,
                        description: ingredient.description
                    }
                )
            }
        ));

        return Object.assign(
            {
                'id': this._id.toString(),
                'title': this.title,
                'prep_time': this.prep_time,
                'cook_time': this.cook_time,
                'ingredient_sections': ingSections,
                'method': this.method,
                'reference_url': this.reference_url,
                'image_url': this.image_url,
                'last_updated': this.updatedAt.getTime()
            },
            this.serves === undefined ? {makes: this.makes} : {serves: this.serves}
        );
    });


module.exports = mongoose.model('IRecipe', Recipe);

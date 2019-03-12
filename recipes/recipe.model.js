'use strict'

const mongoose = require('mongoose')

const MaxUnitType = require('../food/module').unitTypes.length - 1

const isFinitePositiveNumber = v => v > 0 && v < Number.POSITIVE_INFINITY
const isPopulated = arr => arr.length > 0

/**
 * Each ingredient can have one of two different structures, depending on the ingredient type.
 */
const options = { discriminatorKey: 'ingredientType', _id: false, strict: true }
const IngredientSchema = new mongoose.Schema({}, options)

const Recipe = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlength: 1
    },
    serves: {
        type: Number,
        required: function () {
            return this.makes === undefined
        },
        validate: {
            validator: function (serves) {
                return this.makes !== undefined ? false : serves > 0 && serves < Number.POSITIVE_INFINITY
            },
            message: 'serves should be defined iff makes is undefined and must be greater than zero'
        }
    },
    makes: {
        type: Number,
        required: function () {
            return this.serves === undefined
        },
        validate: {
            validator: function (makes) {
                return this.serves !== undefined ? false : makes > 0 && makes < Number.POSITIVE_INFINITY
            },
            message: 'makes should be defined iff serves is undefined and must be greater than zero'
        }
    },
    prepTime: {
        type: Number,
        required: true,
        validate: {
            validator: isFinitePositiveNumber,
            message: 'prepTime must be greater than zero'
        }
    },
    cookTime: {
        type: Number,
        required: true,
        validate: {
            validator: isFinitePositiveNumber,
            message: 'cookTime must be greater than zero'
        }
    },
    ingredientSections: {
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
                        ingredients.map(ingredient => ['Quantified', 'FreeText'].includes(ingredient.ingredientType))
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
    referenceUrl: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    }
}, { timestamps: true })


Recipe.path('ingredientSections').schema.path('ingredients').discriminator('Quantified', new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        validate: {
            validator: isFinitePositiveNumber,
            message: 'ingredient amount must be greater than zero'
        }
    },
    unitIds: {
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
    foodId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },
    additionalDesc: {
        type: String,
        required: false,
        minlength: 1
    }
}, { _id: false }))

Recipe.path('ingredientSections').schema.path('ingredients').discriminator('FreeText', new mongoose.Schema({
    description: {
        type: String,
        required: true,
        minlength: 1
    }
}, { _id: false }))

Recipe.virtual('exportable')
    .get(function () {
        // Replace the 'Quantified' and 'FreeText' ingredient types with 0 and 1 respectively
        const ingSections = this.ingredientSections.map(section => Object.assign(
            section.heading ? { heading: section.heading } : {},
            {
                ingredients: section.ingredients.map(ingredient => ingredient.ingredientType === 'Quantified' ?
                    {
                        ingredientType: 0,
                        amount: ingredient.amount,
                        unitIds: ingredient.unitIds,
                        foodId: ingredient.foodId,
                        additionalDesc: ingredient.additionalDesc
                    } :
                    {
                        ingredientType: 1,
                        description: ingredient.description
                    }
                )
            }
        ))

        return Object.assign(
            {
                'id': this._id.toString(),
                'title': this.title,
                'prepTime': this.prepTime,
                'cookTime': this.cookTime,
                'ingredientSections': ingSections,
                'method': this.method,
                'referenceUrl': this.referenceUrl,
                'imageUrl': this.imageUrl,
                'lastUpdated': this.updatedAt.getTime()
            },
            this.serves === undefined ? { makes: this.makes } : { serves: this.serves }
        )
    })


module.exports = mongoose.model('IRecipe', Recipe)

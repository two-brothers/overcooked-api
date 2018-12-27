'use strict';

const mongoose = require('mongoose');

const MaxUnitType = require('../food/module').unit_types.length - 1;

const isPositiveNumber = v => v > 0;
const isPopulated = arr => arr.length > 0;

const Recipe = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    serves: {
        type: Number,
        required: function () {
            return this.makes === undefined
        },
        validate: {
            validator: function (serves) {
                return this.makes !== undefined ? false : serves > 0
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
                return this.serves !== undefined ? false : makes > 0
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
                type: [{
                    _id: false,
                    amount: {
                        type: Number,
                        required: true,
                        validate: {
                            validator: isPositiveNumber,
                            message: 'ingredient amount must be greater than zero'
                        }
                    },
                    unit_id: {
                        type: Number,
                        required: true,
                        min: 0,
                        max: MaxUnitType,
                        validate: {
                            validator: Number.isInteger,
                            message: 'Unit ID must be an integer'
                        }
                    },
                    food_id: {
                        type: mongoose.Schema.ObjectId,
                        required: true
                    }
                }],
                validate: {
                    validator: isPopulated,
                    message: 'There must be at least one ingredient in every ingredient section'
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

Recipe.virtual('exportable')
    .get(function () {
        const exp = {
            'id': this._id.toString(),
            'title': this.title,
            'prep_time': this.prep_time,
            'cook_time': this.cook_time,
            'ingredient_sections': this.ingredient_sections,
            'method': this.method,
            'reference_url': this.reference_url,
            'image_url': this.image_url,
            'last_updated': this.updatedAt.getTime()
        };
        if (this.serves === undefined) {
            exp.makes = this.makes
        } else {
            exp.serves = this.serves
        }
        return exp;
    });


module.exports = mongoose.model('IRecipe', Recipe);
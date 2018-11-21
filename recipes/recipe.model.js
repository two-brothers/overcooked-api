'use strict';

const mongoose = require('mongoose');

const Recipe = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    serves: {
        type: Number,
        required: false
    },
    makes: {
        type: Number,
        required: false
    },
    prep_time: {
        type: Number,
        required: true
    },
    cook_time: {
        type: Number,
        required: true
    },
    ingredient_sections: {
        type: [{
            _id: false,
            heading: {
                type: String,
                required: false
            },
            ingredients: {
                type: [{
                    _id: false,
                    amount: {
                        type: Number,
                        required: true
                    },
                    unit_id: {
                        type: Number,
                        required: true,
                        min: 0,
                        max: 12,
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
                required: true
            }
        }],
        required: true
    },
    method: {
        type: [String],
        required: true
    },
    reference_url: {
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
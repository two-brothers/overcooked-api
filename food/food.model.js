'use strict';

const mongoose = require('mongoose');
const MaxUnitType = require('./unit_types').length - 1;

const Food = new mongoose.Schema({
    name: {
        singular: {
            type: String,
            required: true
        },
        plural: {
            type: String,
            required: true
        }
    },
    conversions: {
        type: [{
            _id: false,
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
            ratio: {
                type: Number,
                required: true,
                validate: {
                    validator: ratio => ratio > 0,
                    message: 'Conversion ratio must be greater than zero'
                }
            }
        }],
        validate: {
            validator: conversions => conversions.length > 0,
            message: 'There must be at least one conversion'
        }
    }
});

// Remove the internal Mongoose parameters before exposing the record to the user
Food.virtual('exportable')
    .get(function () {
        return {
            'id': this._id.toString(),
            'name': this.name,
            'conversions': this.conversions
        }
    });

module.exports = mongoose.model('IFood', Food);
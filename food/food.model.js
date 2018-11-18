'use strict';

const mongoose = require('mongoose');

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
                max: 12,
                validate: {
                    validator: Number.isInteger,
                    message: 'Unit ID must be an integer'
                }
            },
            ratio: {
                type: Number,
                required: true
            }
        }],
        required: true
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
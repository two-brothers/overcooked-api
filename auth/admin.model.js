'use strict'

const mongoose = require('mongoose')

const Admin = new mongoose.Schema({
    profile: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('IAdmin', Admin)

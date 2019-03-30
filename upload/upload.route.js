'use strict'

const express = require('express')
const router = express.Router()
const wrapper = require('../response-wrapper')
const VLD = require('../request-validator')
const path = require('path')
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

/*** URI: /upload ***/

const wrapped = (resourceDir) => {

    /**
     * Save the file to resourceDir under the specified filename and return the relative url
     * (which is just the filename)
     */
    router.post('/', ensureAuth, (req, res, next) => {
        const error = VLD.firstError(
            VLD.required(req.files, () => true, 'FormData must have a file attribute'),
            req.files && VLD.required(req.files.file, () => true, 'FormData must have a file attribute'),
            req.files && req.files.file && VLD.required(req.files.file.mv, () => true, 'FormData attribute file must be a File object'),
            req.files && req.files.file && VLD.required(req.files.file.name, VLD.isNonEmptyString, 'FormData attribute file.name must be a non-empty string')
        )

        if (error) {
            return next({ status: 400, message: error })
        }

        const file = req.files.file
        const fileLocation = path.join('uploads', file.name)
        file.mv(path.join(resourceDir, fileLocation))
            .then(() => res.wrap(`/${fileLocation}`))
            .catch(err => next({ status: 500, message: err }))
    })

    return router
}

module.exports = wrapped

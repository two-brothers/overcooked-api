'use strict'

process.env.NODE_ENV = 'test'

const chai = require('chai')
const chaiHttp = require('chai-http')
const sinon = require('sinon')
const mongoose = require('mongoose')

chai.use(chaiHttp)

describe.only('/upload', () => {
    let server
    let authenticated

    before(() => {
        const auth = require('../auth/module')
        sinon.stub(auth, 'ensureAuth').callsFake((req, res, next) => authenticated ? next() : res.status(401).send())

        sinon.stub(mongoose, 'connect').returns(Promise.resolve(true))
        server = require('../www')
    })

    let endpoint
    let request

    beforeEach(() => {
        endpoint = '/v1/upload'
        request = chai.request(server)
    })

    describe('POST', () => {

        describe('user is authenticated', () => {

            beforeEach(() => {
                authenticated = true
                request = request.post(endpoint).type('form')
            })

            describe('no file attached', () => {
                it('should return a Bad Request error', () =>
                    request
                        .then(res => res.status.should.equal(400))
                )
            })

            describe('file attached', () => {

                const SAMPLE_FILE = 'LICENSE' // this is actually a file on the file system
                const EXPECTED_URL = `/uploads/${SAMPLE_FILE}`

                beforeEach(() => {
                    request = request.attach('file', SAMPLE_FILE)
                })

                it('should return a 200 (OK) response with the file url', () =>
                    request
                        .then(res => {
                            res.status.should.equal(200)
                            res.body.data.should.equal(EXPECTED_URL)
                        })
                )

                it('should return the file on request', () =>
                    chai.request(server)
                        .get(`/cms${EXPECTED_URL}`) // the static files are saved under /cms
                        .then(res => {
                            res.status.should.equal(200)
                            res.headers['content-type'].should.equal('application/octet-stream')
                            Number(res.headers['content-length']).should.be.greaterThan(0)
                        })
                )
            })
        })

        describe('user is not authenticated', () => {
            beforeEach(() => {
                authenticated = false
            })

            it('should return an Unauthorised error', () =>
                request.post(endpoint)
                    .send({})
                    .then(res => res.status.should.equal(401))
            )
        })
    })
})


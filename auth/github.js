const GitHubStrategy = require('passport-github').Strategy

const Admin = require('./admin.model')
const secrets = require('./secrets/oauth.secrets')

const version = '/v1'
const strategy = new GitHubStrategy({
        clientID: secrets.GITHUB_CLIENT_ID,
        clientSecret: secrets.GITHUB_SECRET,
        callbackURL: `${version}/auth/github/callback`
    }, (accessToken, refreshToken, profile, cb) => {
        Admin.findOne({ profile: profile.username })
            .then(user => user ?
                cb(null, user) :
                cb(new Error('Unauthorised user'))
            )
            .catch(err => cb(err))
    }
)

module.exports = strategy

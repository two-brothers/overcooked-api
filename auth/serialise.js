const Admin = require('./admin.model')

const serialise = (user, cb) => {
    cb(null, user.profile)
}

const deserialise = (profile, cb) => {
    Admin.findOne({ profile: profile })
        .then(user => cb(null, user))
        .catch(err => cb(err))
}

module.exports = {
    serialise: serialise,
    deserialise: deserialise
}

const Admin = require('./admin.model');

const profiles = [
    'bigfriedicecream',
    'nikeshnazareth'
];

/**
 * Create the admin profiles if they don't exist
 * @returns {Promise} a promise that succeeds if all admins were successfully found or added
 */
const initialise = () =>
    Promise.all(profiles.map(profile =>
        Admin.findOne({profile: profile})
            .then(record => record ? record : Admin.create({profile: profile}))
            .then(() => null)
    ));

module.exports = initialise;
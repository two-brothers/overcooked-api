/**
 * Middleware to be run before protected routes.
 * Return a 401 if the user is not authenticated
 */
module.exports = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).send('User is not authenticated');
};
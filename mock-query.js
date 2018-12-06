/**
 * A class to simulate a Mongoose query
 * It supports the operations
 *   - sort({property: +/- 1})
 *   - limit
 *   - skip
 */

class MockQuery {

    /**
     * @param recordPromises the records to be returned
     */
    constructor(recordPromises) {
        this.recordsPromise = Promise.all(recordPromises);
        this.skipAmount = 0;
        this.limitAmount = recordPromises.length;
    }

    /**
     * Sort the records
     * @param param an object of the form { prop: <dir> } where 'prop' is the property to sort by,
     * and <dir> is 1 for ascending order, or -1 for descending order
     * @returns {MockQuery} this query object (so calls can be chained)
     */
    sort(param) {
        const prop = Object.getOwnPropertyNames(param)[0];
        this.recordsPromise = this.recordsPromise
            .then(records => {
                records.sort((a, b) =>
                    param[prop] > 0 ?
                        (a[prop] < b[prop] ? -1 : 1) : // sort ascending
                        (a[prop] < b[prop] ? 1 : -1) // sort ascending
                );
                return records;
            });
        return this;
    }

    /**
     * Skips the specified number of records
     * @param amount the amount of records to skip
     * @returns {MockQuery} this query object (so calls can be chained)
     */
    skip(amount) {
        this.skipAmount += amount;
        return this;
    }

    /**
     * Limits the number of records return
     * @param amount the maximum number of records to return
     * @returns {MockQuery} this query object (so calls can be chained)
     */
    limit(amount) {
        this.limitAmount = amount;
        return this;
    }

    /**
     * Executes the query and returns a promise formed by applying the specified fn to the results
     * @param fn the function to execute on the results of the query
     */
    then(fn) {
        return this.recordsPromise
            .then(records => records.slice(this.skipAmount, this.skipAmount + this.limitAmount))
            .then(fn)
    }
}

module.exports = MockQuery;

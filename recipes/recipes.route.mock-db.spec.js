const MockRecord = require('../mock-database').record;

const DatabaseModels = {
    Food: 'FOOD',
    Recipe: 'RECIPE'
};

class FoodRecord extends MockRecord {
    get exportable() {
        return this;
    }
}

class RecipeRecord extends MockRecord {
    constructor(updateRecordFn, removeRecordFn) {
        super(updateRecordFn, removeRecordFn);
        // to avoid every record in a batch upload having the same timestamp,
        // pick a random time within the last 5 seconds
        this.last_updated = Date.now() - Math.floor(Math.random() * 5000);
    }

    save() {
        super.save();
        this.last_updated = Date.now();
    }

    get exportable() {
        return this;
    }

    get updatedAt() {
        return this.last_updated;
    }
}

module.exports = {
    models: DatabaseModels,
    records: {
        Food: FoodRecord,
        Recipe: RecipeRecord
    }
};

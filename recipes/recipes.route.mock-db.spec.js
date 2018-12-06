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
        this.last_updated = Date.now();
    }

    save() {
        super.save();
        this.last_updated = Date.now();
    }

    get exportable() {
        return this;
    }
}

module.exports = {
    models: DatabaseModels,
    records: {
        Food: FoodRecord,
        Recipe: RecipeRecord
    }
};

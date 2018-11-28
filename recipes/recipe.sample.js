// This file was created with the ./create_recipes.py script

// note: food_id values should be the server-generated ID corresponding to the food record
// since we can't know the value beforehand (and these are randomly generated recipes)
// food_id is set to the index of the food when all foods are retrieved from the database

module.exports = [{
    'title': 'Sample Recipe #0',
    'serves': 4,
    'prep_time': 14,
    'cook_time': 33,
    'ingredient_sections': [{
        'ingredients': [{'amount': 9, 'unit_id': 7, 'food_id': 3}, {
            'amount': 5,
            'unit_id': 2,
            'food_id': 16
        }, {'amount': 3, 'unit_id': 2, 'food_id': 29}, {'amount': 7, 'unit_id': 11, 'food_id': 20}, {
            'amount': 6,
            'unit_id': 2,
            'food_id': 6
        }]
    }, {
        'ingredients': [{'amount': 6, 'unit_id': 12, 'food_id': 7}, {
            'amount': 10,
            'unit_id': 10,
            'food_id': 14
        }, {'amount': 8, 'unit_id': 3, 'food_id': 29}, {'amount': 5, 'unit_id': 1, 'food_id': 25}, {
            'amount': 4,
            'unit_id': 1,
            'food_id': 14
        }, {'amount': 3, 'unit_id': 6, 'food_id': 1}, {'amount': 6, 'unit_id': 3, 'food_id': 10}, {
            'amount': 4,
            'unit_id': 2,
            'food_id': 20
        }, {'amount': 3, 'unit_id': 2, 'food_id': 26}, {'amount': 7, 'unit_id': 6, 'food_id': 2}]
    }, {
        'heading': 'Section #2',
        'ingredients': [{'amount': 6, 'unit_id': 7, 'food_id': 21}, {
            'amount': 8,
            'unit_id': 6,
            'food_id': 28
        }, {'amount': 9, 'unit_id': 8, 'food_id': 26}, {'amount': 4, 'unit_id': 12, 'food_id': 1}, {
            'amount': 8,
            'unit_id': 2,
            'food_id': 9
        }, {'amount': 8, 'unit_id': 1, 'food_id': 23}, {'amount': 6, 'unit_id': 10, 'food_id': 7}, {
            'amount': 7,
            'unit_id': 0,
            'food_id': 20
        }]
    }],
    'method': ['Do the first thing', 'Then the second', 'The third usually follows'],
    'reference_url': 'https://example_reference.com'
}, {
    'title': 'Sample Recipe #1',
    'serves': 10,
    'prep_time': 11,
    'cook_time': 33,
    'ingredient_sections': [{
        'ingredients': [{'amount': 10, 'unit_id': 10, 'food_id': 10}, {
            'amount': 6,
            'unit_id': 8,
            'food_id': 7
        }, {'amount': 10, 'unit_id': 2, 'food_id': 17}, {'amount': 7, 'unit_id': 6, 'food_id': 9}, {
            'amount': 8,
            'unit_id': 5,
            'food_id': 2
        }, {'amount': 10, 'unit_id': 0, 'food_id': 12}, {'amount': 9, 'unit_id': 9, 'food_id': 4}]
    }, {
        'heading': 'Section #1',
        'ingredients': [{'amount': 7, 'unit_id': 12, 'food_id': 3}, {
            'amount': 4,
            'unit_id': 11,
            'food_id': 25
        }, {'amount': 10, 'unit_id': 0, 'food_id': 12}, {'amount': 9, 'unit_id': 9, 'food_id': 6}, {
            'amount': 10,
            'unit_id': 11,
            'food_id': 9
        }, {'amount': 6, 'unit_id': 11, 'food_id': 25}, {'amount': 5, 'unit_id': 3, 'food_id': 22}]
    }],
    'method': ['Do the first thing', 'Then the second', 'The third usually follows'],
    'reference_url': 'https://example_reference.com'
}, {
    'title': 'Sample Recipe #2',
    'makes': 3,
    'prep_time': 30,
    'cook_time': 37,
    'ingredient_sections': [{
        'ingredients': [{'amount': 8, 'unit_id': 7, 'food_id': 6}, {
            'amount': 4,
            'unit_id': 5,
            'food_id': 14
        }, {'amount': 5, 'unit_id': 0, 'food_id': 29}, {'amount': 8, 'unit_id': 9, 'food_id': 18}, {
            'amount': 8,
            'unit_id': 6,
            'food_id': 24
        }, {'amount': 8, 'unit_id': 12, 'food_id': 1}]
    }, {
        'heading': 'Section #1',
        'ingredients': [{'amount': 10, 'unit_id': 10, 'food_id': 5}, {
            'amount': 5,
            'unit_id': 7,
            'food_id': 13
        }, {'amount': 7, 'unit_id': 12, 'food_id': 25}, {'amount': 3, 'unit_id': 0, 'food_id': 20}, {
            'amount': 9,
            'unit_id': 5,
            'food_id': 29
        }, {'amount': 5, 'unit_id': 10, 'food_id': 22}]
    }],
    'method': ['Do the first thing', 'Then the second', 'The third usually follows'],
    'reference_url': 'https://example_reference.com'
}, {
    'title': 'Sample Recipe #3',
    'makes': 7,
    'prep_time': 30,
    'cook_time': 40,
    'ingredient_sections': [{
        'ingredients': [{'amount': 6, 'unit_id': 7, 'food_id': 15}, {
            'amount': 3,
            'unit_id': 2,
            'food_id': 27
        }, {'amount': 3, 'unit_id': 12, 'food_id': 22}, {'amount': 8, 'unit_id': 0, 'food_id': 11}, {
            'amount': 6,
            'unit_id': 3,
            'food_id': 16
        }, {'amount': 6, 'unit_id': 9, 'food_id': 17}]
    }, {
        'ingredients': [{'amount': 4, 'unit_id': 3, 'food_id': 26}, {
            'amount': 5,
            'unit_id': 2,
            'food_id': 13
        }, {'amount': 4, 'unit_id': 2, 'food_id': 22}, {'amount': 10, 'unit_id': 9, 'food_id': 26}, {
            'amount': 4,
            'unit_id': 2,
            'food_id': 17
        }]
    }],
    'method': ['Do the first thing', 'Then the second', 'The third usually follows'],
    'reference_url': 'https://example_reference.com'
}, {
    'title': 'Sample Recipe #4',
    'serves': 8,
    'prep_time': 26,
    'cook_time': 22,
    'ingredient_sections': [{
        'heading': 'Section #0',
        'ingredients': [{'amount': 8, 'unit_id': 7, 'food_id': 28}, {
            'amount': 10,
            'unit_id': 1,
            'food_id': 6
        }, {'amount': 4, 'unit_id': 11, 'food_id': 10}, {'amount': 9, 'unit_id': 4, 'food_id': 7}, {
            'amount': 6,
            'unit_id': 0,
            'food_id': 17
        }]
    }, {
        'heading': 'Section #1',
        'ingredients': [{'amount': 5, 'unit_id': 0, 'food_id': 8}, {
            'amount': 3,
            'unit_id': 8,
            'food_id': 3
        }, {'amount': 4, 'unit_id': 5, 'food_id': 2}, {'amount': 3, 'unit_id': 11, 'food_id': 19}, {
            'amount': 3,
            'unit_id': 2,
            'food_id': 17
        }, {'amount': 5, 'unit_id': 12, 'food_id': 22}]
    }, {
        'heading': 'Section #2',
        'ingredients': [{'amount': 6, 'unit_id': 4, 'food_id': 27}, {
            'amount': 8,
            'unit_id': 6,
            'food_id': 6
        }, {'amount': 10, 'unit_id': 10, 'food_id': 25}, {'amount': 6, 'unit_id': 9, 'food_id': 18}, {
            'amount': 3,
            'unit_id': 9,
            'food_id': 23
        }, {'amount': 9, 'unit_id': 0, 'food_id': 19}, {'amount': 5, 'unit_id': 7, 'food_id': 0}, {
            'amount': 7,
            'unit_id': 5,
            'food_id': 15
        }, {'amount': 3, 'unit_id': 7, 'food_id': 4}, {'amount': 6, 'unit_id': 12, 'food_id': 1}]
    }],
    'method': ['Do the first thing', 'Then the second', 'The third usually follows'],
    'reference_url': 'https://example_reference.com'
}, {
    'title': 'Sample Recipe #5',
    'serves': 5,
    'prep_time': 27,
    'cook_time': 5,
    'ingredient_sections': [{
        'ingredients': [{'amount': 10, 'unit_id': 0, 'food_id': 21}, {
            'amount': 8,
            'unit_id': 8,
            'food_id': 17
        }, {'amount': 4, 'unit_id': 7, 'food_id': 20}, {'amount': 7, 'unit_id': 6, 'food_id': 11}, {
            'amount': 10,
            'unit_id': 11,
            'food_id': 10
        }, {'amount': 8, 'unit_id': 10, 'food_id': 11}, {'amount': 10, 'unit_id': 6, 'food_id': 7}, {
            'amount': 7,
            'unit_id': 2,
            'food_id': 17
        }, {'amount': 5, 'unit_id': 3, 'food_id': 10}]
    }, {
        'heading': 'Section #1',
        'ingredients': [{'amount': 4, 'unit_id': 7, 'food_id': 29}, {
            'amount': 6,
            'unit_id': 8,
            'food_id': 15
        }, {'amount': 5, 'unit_id': 8, 'food_id': 25}, {'amount': 8, 'unit_id': 9, 'food_id': 3}, {
            'amount': 6,
            'unit_id': 9,
            'food_id': 19
        }, {'amount': 8, 'unit_id': 7, 'food_id': 2}, {'amount': 6, 'unit_id': 3, 'food_id': 15}, {
            'amount': 6,
            'unit_id': 12,
            'food_id': 6
        }, {'amount': 8, 'unit_id': 6, 'food_id': 14}, {'amount': 8, 'unit_id': 5, 'food_id': 4}]
    }, {
        'ingredients': [{'amount': 4, 'unit_id': 1, 'food_id': 18}, {
            'amount': 10,
            'unit_id': 4,
            'food_id': 23
        }, {'amount': 4, 'unit_id': 1, 'food_id': 24}, {'amount': 10, 'unit_id': 12, 'food_id': 0}, {
            'amount': 7,
            'unit_id': 10,
            'food_id': 4
        }, {'amount': 8, 'unit_id': 0, 'food_id': 25}]
    }],
    'method': ['Do the first thing', 'Then the second', 'The third usually follows'],
    'reference_url': 'https://example_reference.com'
}, {
    'title': 'Sample Recipe #6',
    'makes': 4,
    'prep_time': 18,
    'cook_time': 37,
    'ingredient_sections': [{
        'ingredients': [{'amount': 3, 'unit_id': 7, 'food_id': 15}, {
            'amount': 10,
            'unit_id': 2,
            'food_id': 25
        }, {'amount': 6, 'unit_id': 10, 'food_id': 10}, {'amount': 7, 'unit_id': 1, 'food_id': 28}, {
            'amount': 7,
            'unit_id': 7,
            'food_id': 6
        }]
    }, {
        'ingredients': [{'amount': 5, 'unit_id': 3, 'food_id': 7}, {
            'amount': 9,
            'unit_id': 10,
            'food_id': 7
        }, {'amount': 5, 'unit_id': 3, 'food_id': 3}, {'amount': 8, 'unit_id': 9, 'food_id': 17}, {
            'amount': 9,
            'unit_id': 11,
            'food_id': 14
        }, {'amount': 7, 'unit_id': 9, 'food_id': 26}, {'amount': 9, 'unit_id': 1, 'food_id': 14}, {
            'amount': 7,
            'unit_id': 5,
            'food_id': 18
        }, {'amount': 7, 'unit_id': 3, 'food_id': 28}, {'amount': 6, 'unit_id': 10, 'food_id': 22}]
    }],
    'method': ['Do the first thing', 'Then the second', 'The third usually follows'],
    'reference_url': 'https://example_reference.com'
}, {
    'title': 'Sample Recipe #7',
    'serves': 9,
    'prep_time': 21,
    'cook_time': 40,
    'ingredient_sections': [{
        'heading': 'Section #0',
        'ingredients': [{'amount': 10, 'unit_id': 3, 'food_id': 18}, {
            'amount': 6,
            'unit_id': 12,
            'food_id': 21
        }, {'amount': 10, 'unit_id': 0, 'food_id': 17}, {'amount': 6, 'unit_id': 8, 'food_id': 19}, {
            'amount': 9,
            'unit_id': 0,
            'food_id': 16
        }, {'amount': 7, 'unit_id': 8, 'food_id': 7}]
    }, {
        'ingredients': [{'amount': 10, 'unit_id': 9, 'food_id': 2}, {
            'amount': 7,
            'unit_id': 6,
            'food_id': 15
        }, {'amount': 8, 'unit_id': 12, 'food_id': 4}, {'amount': 8, 'unit_id': 5, 'food_id': 25}, {
            'amount': 5,
            'unit_id': 10,
            'food_id': 20
        }, {'amount': 8, 'unit_id': 10, 'food_id': 17}, {'amount': 5, 'unit_id': 12, 'food_id': 3}, {
            'amount': 6,
            'unit_id': 8,
            'food_id': 12
        }]
    }],
    'method': ['Do the first thing', 'Then the second', 'The third usually follows'],
    'reference_url': 'https://example_reference.com'
}, {
    'title': 'Sample Recipe #8',
    'makes': 5,
    'prep_time': 23,
    'cook_time': 15,
    'ingredient_sections': [{
        'heading': 'Section #0',
        'ingredients': [{'amount': 3, 'unit_id': 3, 'food_id': 5}, {
            'amount': 6,
            'unit_id': 0,
            'food_id': 8
        }, {'amount': 6, 'unit_id': 11, 'food_id': 16}, {'amount': 7, 'unit_id': 10, 'food_id': 6}, {
            'amount': 6,
            'unit_id': 8,
            'food_id': 23
        }, {'amount': 4, 'unit_id': 6, 'food_id': 9}, {'amount': 3, 'unit_id': 2, 'food_id': 17}, {
            'amount': 7,
            'unit_id': 5,
            'food_id': 17
        }, {'amount': 10, 'unit_id': 4, 'food_id': 26}]
    }, {
        'ingredients': [{'amount': 8, 'unit_id': 6, 'food_id': 9}, {
            'amount': 9,
            'unit_id': 5,
            'food_id': 12
        }, {'amount': 9, 'unit_id': 12, 'food_id': 19}, {'amount': 9, 'unit_id': 8, 'food_id': 1}, {
            'amount': 8,
            'unit_id': 9,
            'food_id': 29
        }, {'amount': 3, 'unit_id': 0, 'food_id': 2}, {'amount': 8, 'unit_id': 7, 'food_id': 3}, {
            'amount': 8,
            'unit_id': 3,
            'food_id': 29
        }, {'amount': 7, 'unit_id': 6, 'food_id': 5}, {'amount': 3, 'unit_id': 5, 'food_id': 3}]
    }, {
        'ingredients': [{'amount': 7, 'unit_id': 0, 'food_id': 20}, {
            'amount': 8,
            'unit_id': 3,
            'food_id': 15
        }, {'amount': 10, 'unit_id': 7, 'food_id': 19}, {'amount': 3, 'unit_id': 9, 'food_id': 10}, {
            'amount': 6,
            'unit_id': 6,
            'food_id': 17
        }, {'amount': 8, 'unit_id': 10, 'food_id': 2}, {'amount': 5, 'unit_id': 0, 'food_id': 22}, {
            'amount': 6,
            'unit_id': 1,
            'food_id': 1
        }, {'amount': 8, 'unit_id': 10, 'food_id': 5}, {'amount': 6, 'unit_id': 2, 'food_id': 9}]
    }],
    'method': ['Do the first thing', 'Then the second', 'The third usually follows'],
    'reference_url': 'https://example_reference.com'
}, {
    'title': 'Sample Recipe #9',
    'makes': 10,
    'prep_time': 29,
    'cook_time': 5,
    'ingredient_sections': [{
        'heading': 'Section #0',
        'ingredients': [{'amount': 3, 'unit_id': 5, 'food_id': 25}, {
            'amount': 4,
            'unit_id': 8,
            'food_id': 2
        }, {'amount': 8, 'unit_id': 7, 'food_id': 23}, {'amount': 9, 'unit_id': 6, 'food_id': 6}, {
            'amount': 5,
            'unit_id': 8,
            'food_id': 10
        }]
    }, {
        'ingredients': [{'amount': 9, 'unit_id': 5, 'food_id': 15}, {
            'amount': 3,
            'unit_id': 1,
            'food_id': 26
        }, {'amount': 7, 'unit_id': 9, 'food_id': 25}, {'amount': 9, 'unit_id': 4, 'food_id': 5}, {
            'amount': 4,
            'unit_id': 12,
            'food_id': 9
        }, {'amount': 9, 'unit_id': 8, 'food_id': 17}, {'amount': 4, 'unit_id': 6, 'food_id': 12}, {
            'amount': 4,
            'unit_id': 5,
            'food_id': 27
        }, {'amount': 3, 'unit_id': 8, 'food_id': 0}, {'amount': 6, 'unit_id': 5, 'food_id': 5}]
    }],
    'method': ['Do the first thing', 'Then the second', 'The third usually follows'],
    'reference_url': 'https://example_reference.com'
}];
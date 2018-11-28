#!/usr/bin/env python3

from random import randint

NUM_UNIT_TYPES = 13 # Manually set based on the food/unit_types.js file
FOOD_PAGE_SIZE = 30 # Manually set based on the food/food.sample.js file
NUM_RECIPES = 26 # Arbitrary

def createIngredient():
  return {
    'amount': randint(3,10),
    'unit_id': randint(0, NUM_UNIT_TYPES - 1),
    'food_id': randint(0, FOOD_PAGE_SIZE - 1)  # Should be replaced by the ID of the corresponding food database record
  }

def createSection(idx):
  section = {}
  if randint(0,1) == 0:
    section['heading'] = 'Section #{}'.format(idx)
  num_ingredients = randint(5,10)
  section['ingredients'] = list(map(lambda idx: createIngredient(), range(num_ingredients)))
  return section

def createRecipe(idx):
  recipe = {}
  recipe['title'] = 'Sample Recipe #{}'.format(idx);
  recipe['serves' if randint(0,1) == 0 else 'makes'] = randint(3, 10)
  recipe['prep_time'] = randint(10,30)
  recipe['cook_time'] = randint(5, 40)
  num_sections = randint(2,3)
  recipe['ingredient_sections'] = list(map(lambda idx: createSection(idx), range(num_sections)))
  recipe['method'] = ['Do the first thing', 'Then the second', 'The third usually follows']
  recipe['reference_url'] = 'https://example_reference.com'
  return recipe


recipes = list(map(lambda idx: createRecipe(idx), range(10)))

# write the results to file
f = open('./recipe.sample.js', 'w')
f.write("""
// This file was created with the ./create_recipes.py script

// note: food_id values should be the server-generated ID corresponding to the food record
// since we can't know the value beforehand (and these are randomly generated recipes)
// food_id is set to the index of the food when all foods are retrieved from the database

""")

f.write('module.exports = {};'.format(recipes))
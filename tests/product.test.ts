import {expect, test} from 'vitest';

import Fruit from '../src/model/Product/fruit.ts';
import Vegetable from '../src/model/Product/vegetable.ts';
import { InvalidPriceException } from '../src/model/Product/product.ts';

//no need to test if generic products can be created since they 
// are abstract classes and cannot be instantiated directly, so we will 
// test the concrete classes that extend them instead

test("Can create Fruit with non-negative price", (): void => {
    let fruit = new Fruit(2);
    expect(fruit.price >= 0).equals(true);
});

test("Cannot create Fruit with negative price", (): void => {
    expect(() => new Fruit(-1)).toThrow(InvalidPriceException);
});

test("Can create Vegetable with non-negative price", (): void => {
    let vegetable = new Vegetable(3);
    expect(vegetable.price >= 0).equals(true);
});

test("Cannot create Vegetable with negative price", (): void => {
    expect(() => new Vegetable(-1)).toThrow(InvalidPriceException);
});
import {expect, test} from 'vitest';

import Cart, { InvalidCheckoutException } from '../src/model/cart';
import Receipt from '../src/model/receipt';
import Fruit from '../src/model/Product/fruit';
import Vegetable from '../src/model/Product/vegetable';

test('Receipt throws an error on an empty cart', () => {
    const cart = new Cart();
    expect(() => new Receipt(cart)).toThrow(InvalidCheckoutException);
})

test('Receipt calculates total price correctly', () => {
    const cart = new Cart();

    //not possible to create a receipt for an empty cart

    let fruit = new Fruit(2);
    cart.addItem(fruit);

    expect(new Receipt(cart).total).toBe(2);

    let vegetable = new Vegetable(3);
    cart.addItem(vegetable);

    expect(new Receipt(cart).total).toBe(5);

    let anotherFruit = new Fruit(5);
    cart.addItem(anotherFruit);
    expect(new Receipt(cart).total).toBe(10);
});

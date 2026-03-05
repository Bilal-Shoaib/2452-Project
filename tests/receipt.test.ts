import {expect, test} from 'vitest';

import Cart from '../src/model/cart';
import Receipt from '../src/model/receipt';
import Fruit from '../src/model/Product/fruit';
import Vegetable from '../src/model/Product/vegetable';

test('Receipt summarizes products correctly', () => {
    const cart = new Cart();
    let fruit = new Fruit(2);
    let vegetable = new Vegetable(3);

    cart.addItem(fruit);
    cart.addItem(vegetable);

    const receipt = new Receipt(cart);

    const summary = receipt.summarizeItems();

    expect(summary.get('Fruit')).toEqual([fruit]);
    expect(summary.get('Vegetable')).toEqual([vegetable]);

    expect(summary.size).toBe(2);
    expect(summary.get('Fruit')!.length).toBe(1);
    expect(summary.get('Vegetable')!.length).toBe(1);

    let anotherFruit = new Fruit(5);
    cart.addItem(anotherFruit);

    expect(summary.get('Fruit')).toEqual([fruit]);
    expect(summary.get('Vegetable')).toEqual([vegetable]);

    expect(summary.size).toBe(2);
    expect(summary.get('Fruit')!.length).toBe(1);
    expect(summary.get('Vegetable')!.length).toBe(1);

    const newSummary = receipt.summarizeItems();

    expect(newSummary.get('Fruit')).toEqual([fruit, anotherFruit]);
    expect(newSummary.get('Vegetable')).toEqual([vegetable]);

    expect(newSummary.size).toBe(2);
    expect(newSummary.get('Fruit')!.length).toBe(2);
    expect(newSummary.get('Vegetable')!.length).toBe(1);
});

test('Receipt calculates total price correctly', () => {
    const cart = new Cart();

    expect(new Receipt(cart).total).toBe(0);

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

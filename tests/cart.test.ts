import {expect, test} from 'vitest';
import { InvalidCheckoutException } from '../src/model/cart.ts';

import Cart from '../src/model/cart.ts';
import Fruit from '../src/model/Product/fruit.ts';
import Vegetable from '../src/model/Product/vegetable.ts';

test("Checkout not available for an empty cart", () => {
    const cart = new Cart();
    expect(() => cart.checkout()).toThrow(InvalidCheckoutException);
})

test("Can add fruit to cart", (): void => {
    let fruit = new Fruit(2);
    let cart = new Cart();
    cart.addItem(fruit);

    expect(cart.contains(fruit)).equals(true);
});

test("Can add Vegetable to cart", (): void => {
    let vegetable = new Vegetable(3);
    let cart = new Cart();
    cart.addItem(vegetable);

    expect(cart.contains(vegetable)).equals(true);
});

test("Can add multiple products to cart", (): void => {
    let fruit = new Fruit(2);
    let vegetable = new Vegetable(3);
    let cart = new Cart();
    cart.addItem(fruit);
    cart.addItem(vegetable);

    expect(cart.contains(fruit)).equals(true);
    expect(cart.contains(vegetable)).equals(true);
});

test("Cart notifies listeners when Fruit is added", (): void => {
    let cart = new Cart();
    let fruit = new Fruit(2);
    let notified = false;

    //create a listener that sets notified to true when notify is called
    let listener = {
        notify: () => { notified = true; }
    };
    cart.registerListener(listener);
    cart.addItem(fruit);

    expect(notified).equals(true);
});

test("Cart notifies listeners when Vegetable is added", (): void => {
    let cart = new Cart();
    let vegetable = new Vegetable(3);
    let notified = false;

    //create a listener that sets notified to true when notify is called
    let listener = {
        notify: () => { notified = true; }
    };
    cart.registerListener(listener);
    cart.addItem(vegetable);

    expect(notified).equals(true);
});

test("Cart notifies listeners when multiple products are added", (): void => {
    let cart = new Cart();
    let fruit = new Fruit(2);
    let vegetable = new Vegetable(3);
    let notified = false;

    //create a listener that sets notified to true when notify is called
    let listener = {
        notify: () => { notified = true; }
    };
    cart.registerListener(listener);
    cart.addItem(fruit);
    cart.addItem(vegetable);

    expect(notified).equals(true);
});

test("Cart is empty when created", (): void => {
    let cart = new Cart();
    expect(cart.isEmpty()).equals(true);
});

test("Cart is not empty after adding a product", (): void => {
    let cart = new Cart();
    let fruit = new Fruit(2);
    cart.addItem(fruit);
    expect(cart.isEmpty()).equals(false);
});

test("Cart iterator returns all valid products", (): void => {
    let cart = new Cart();
    let fruit = new Fruit(2);
    let vegetable = new Vegetable(3);
    cart.addItem(fruit);
    cart.addItem(vegetable);

    for (let item of cart) {
        expect(item).toBeOneOf([fruit, vegetable]);
    }
});

test("Cart iterator does not return invalid products", (): void => {
    let cart = new Cart();
    let fruit = new Fruit(2);
    let vegetable = new Vegetable(3);
    cart.addItem(fruit);
    cart.addItem(vegetable);

    let invalidProduct = new Fruit(5); //not added to cart

    for (let item of cart) {
        expect(item).not.equals(invalidProduct);
    }
});

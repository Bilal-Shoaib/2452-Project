import {expect, test} from 'vitest';

import Product from '../src/model/Product/product.ts';
import Fruit from '../src/model/Product/fruit.ts';
import Vegetable from '../src/model/Product/vegetable.ts';
import Smoothie, { InvalidSmoothieQuantityException } from '../src/model/Product/smoothie.ts';
import { InvalidPriceException } from '../src/model/Product/product.ts';
import Cart from '../src/model/cart.ts';

//no need to test if generic products can be created since they 
// are abstract classes and cannot be instantiated directly, so we will 
// test the concrete classes that extend them instead

test("Can create Fruit with non-negative price", (): void => {
    const fruit = new Fruit(2);
    expect(fruit.price >= 0).equals(true);
});

test("Cannot create Fruit with negative price", (): void => {
    expect(() => new Fruit(-1)).toThrow(InvalidPriceException);
});

test("Can create Vegetable with non-negative price", (): void => {
    const vegetable = new Vegetable(3);
    expect(vegetable.price >= 0).equals(true);
});

test("Cannot create Vegetable with negative price", (): void => {
    expect(() => new Vegetable(-1)).toThrow(InvalidPriceException);
});

test("Can create smoothie with non-negative price", (): void => {
    const smoothie = new Smoothie(3);
    expect(smoothie.price >= 0).equals(true);
});

test("Cannot create smoothie with negative price", (): void => {
    expect(() => new Smoothie(-1)).toThrow(InvalidPriceException);
});

test("Can clone Fruit", (): void => {
    const fruit = new Fruit(2);
    const clonedFruit = fruit.clone();
    expect(clonedFruit.price).equals(fruit.price);
    expect(clonedFruit).not.equals(fruit); //cloned fruit should be a different object
});

test("Can clone Vegetable", (): void => {
    const vegetable = new Vegetable(3);
    const clonedVegetable = vegetable.clone();
    expect(clonedVegetable.price).equals(vegetable.price);
    expect(clonedVegetable).not.equals(vegetable);
});

test("Can clone Smoothie", (): void => {
    const smoothie = new Smoothie(4);
    const clonedSmoothie = smoothie.clone();
    expect(clonedSmoothie.price).equals(smoothie.price);
    expect(clonedSmoothie).not.equals(smoothie);
});

test("Can register all products to factory", (): void => {
    expect(() => Fruit.register()).not.toThrow();
    expect(() => Vegetable.register()).not.toThrow();
    expect(() => Smoothie.register()).not.toThrow();
});

test("Can set and get quantity of Smoothie", (): void => {
    const smoothie = new Smoothie(4);
    expect(smoothie.quantity).toBeUndefined(); //quantity should be undefined by default
    smoothie.quantity = 2;
    expect(smoothie.quantity).equals(2);
});

test("Cannot set negative quantity of Smoothie", (): void => {
    const smoothie = new Smoothie(4);
    expect(() => smoothie.quantity = -1).toThrow(InvalidSmoothieQuantityException);
});

test("Can persist and retrieve products from database", async () => {
    const originalCart = new Cart();
    await Cart.saveCart(originalCart);

    const fruit = new Fruit(2);
    const vegetable = new Vegetable(3);
    const smoothie = new Smoothie(4);
    smoothie.quantity = 2;

    await originalCart.addItem(fruit);
    await originalCart.addItem(vegetable);
    await originalCart.addItem(smoothie);

    const retrievedCart = new Cart();
    retrievedCart.id = originalCart.id;
    await Product.getProducts(retrievedCart);

    for (const product of retrievedCart) {
        expect(originalCart.getProductWithID(product.id!)).not.toBeUndefined();
        expect(originalCart.getProductWithID(product.id!)!.price).toBe(product.price);
        if (product instanceof Smoothie) {
            expect((originalCart.getProductWithID(product.id!) as Smoothie)!.quantity).equals(product.quantity);
        }
    }
});
import {expect, test} from 'vitest';

import Cart, { InvalidCheckoutException } from '../src/model/cart';
import Receipt, { CannotApplyCouponException } from '../src/model/receipt';
import Fruit from '../src/model/Product/fruit';
import Vegetable from '../src/model/Product/vegetable';
import Smoothie from '../src/model/Product/smoothie';
import Cashier from '../src/model/cashier';
import { Temporal } from '@js-temporal/polyfill';

test("Receipt throws an error on an empty cart", () => {
    const cart = new Cart();
    const cashier = new Cashier("a", "a", cart);
    expect(() => new Receipt(cart, cashier, Temporal.Now.instant())).toThrow(InvalidCheckoutException);
})

test("Receipt calculates total price correctly", () => {
    const cart = new Cart();
    const cashier = new Cashier("a", "a", cart);

    //not possible to create a receipt for an empty cart

    let fruit = new Fruit(2);
    cart.addItem(fruit);

    expect(new Receipt(cart, cashier, Temporal.Now.instant()).total).toBe(2);

    let vegetable = new Vegetable(3);
    cart.addItem(vegetable);

    expect(new Receipt(cart, cashier, Temporal.Now.instant()).total).toBe(5);

    let anotherFruit = new Fruit(5);
    cart.addItem(anotherFruit);
    expect(new Receipt(cart, cashier, Temporal.Now.instant()).total).toBe(10);
});

test("Receipt tracks coupons correctly", async () => {
    const cart = new Cart();
    await cart.addItem(new Fruit(10));
    await cart.addItem(new Vegetable(10));
    await cart.addItem(new Fruit(10));
    await cart.addItem(new Smoothie(10));

    const cashier = new Cashier("a", "a", cart);
    const receipt = new Receipt(cart, cashier, Temporal.Now.instant());

    for (let coupon of receipt.availableCoupons) {
        receipt.applyCoupon(coupon);
        expect(receipt.appliedCoupons).toContain(coupon);
        expect(receipt.availableCoupons).not.toContain(coupon);
    }
});

test("Receipt notifies all listeners when a coupon is applied", async () => {
    const cart = new Cart();
    await cart.addItem(new Fruit(10));
    await cart.addItem(new Vegetable(10));
    await cart.addItem(new Fruit(10));
    await cart.addItem(new Smoothie(10));

    const cashier = new Cashier("a", "a", cart);
    const receipt = new Receipt(cart, cashier, Temporal.Now.instant());
    let notified = false;

    let listener = {
        notify: () => { notified = true; }
    };
    receipt.registerListener(listener);
    
    for (let coupon of receipt.availableCoupons) {
        receipt.applyCoupon(coupon);
        expect(notified).toBe(true);
        notified = false; //reset for next iteration
    }
});

test("Cannot apply coupons worth more than the total cost", async () => {
    const cart = new Cart();
    await cart.addItem(new Fruit(5));
    await cart.addItem(new Fruit(5));
    await cart.addItem(new Vegetable(10));
    await cart.addItem(new Vegetable(10));
    await cart.addItem(new Fruit(15));
    await cart.addItem(new Fruit(15));
    await cart.addItem(new Vegetable(20));
    await cart.addItem(new Vegetable(20));
    await cart.addItem(new Fruit(25));
    await cart.addItem(new Fruit(25));
    await cart.addItem(new Vegetable(30));
    await cart.addItem(new Vegetable(30));

    const cashier = new Cashier("a", "a", cart);
    const receipt = new Receipt(cart, cashier, Temporal.Now.instant());
    for (let coupon of receipt.availableCoupons) {
        try {
            receipt.applyCoupon(coupon);
        } catch (e) {
            expect(e).toBeInstanceOf(CannotApplyCouponException);
        }
    }
    
});

test("Can persist receipt to the database", async () => {
    const cart = new Cart();
    await cart.addItem(new Fruit(10));
    await cart.addItem(new Vegetable(10));
    await cart.addItem(new Fruit(10));
    await cart.addItem(new Smoothie(10));

    const cashier = new Cashier("a", "a", cart);
    const receipt = new Receipt(cart, cashier, Temporal.Now.instant());

    for (let coupon of receipt.availableCoupons) {
        receipt.applyCoupon(coupon);
    }

    await Cashier.saveCashier(cashier);
    await Receipt.saveReceipt(receipt);

    expect(receipt.id).toBeDefined();
});
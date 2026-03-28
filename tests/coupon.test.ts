import {expect, test} from 'vitest';
import BOGO, { DistinctProductTypeException, SameProductException } from '../src/model/Coupon/bogo';
import Fruit from '../src/model/Product/fruit';
import Vegetable from '../src/model/Product/vegetable';
import Discount from '../src/model/Coupon/discount';
import Cart from '../src/model/cart';
import Receipt from '../src/model/receipt';
import Cashier from '../src/model/cashier';
import { Temporal } from '@js-temporal/polyfill';

test("Cannot create BOGO with same product", (): void => {
    const fruit = new Fruit(2);
    expect(() => new BOGO(fruit, fruit)).toThrow(SameProductException);
});

test("Cannot create BOGO with different product types", (): void => {
    const fruit = new Fruit(2);
    const vegetable = new Vegetable(3);
    expect(() => new BOGO(fruit, vegetable)).toThrow(DistinctProductTypeException);
});

test("Can create valid BOGO", (): void => {
    const fruit1 = new Fruit(2);
    const fruit2 = new Fruit(3);
    const bogo = new BOGO(fruit1, fruit2);

    expect(() => new BOGO(fruit1, fruit2)).not.toThrow();
    expect(bogo).toBeDefined();
});

test("Cannot create Discount with negative amount", (): void => {
    expect(() => new Discount(-1)).toThrow();
});

test("Can create Discount with non-negative amount", (): void => {
    const discount = new Discount(2);
    expect(() => new Discount(2)).not.toThrow();
    expect(discount).toBeDefined();
});

test("Can persist and retrieve BOGO", async () => {
    const fruit1 = new Fruit(2);
    const fruit2 = new Fruit(3);
    const bogo = new BOGO(fruit1, fruit2);
    
    const cart = new Cart();
    await cart.addItem(fruit1);
    await cart.addItem(fruit2);
    
    const cashier = new Cashier("a", "a", cart);
    await Cashier.saveCashier(cashier);
    
    const receipt = new Receipt(cart, cashier, Temporal.Now.instant());
    await Receipt.saveReceipt(receipt);

    await bogo.saveCoupon(receipt.id!);
    expect(bogo.id).toBeDefined();

    const retrievedBOGOs = await BOGO.getBOGO(receipt);
    expect(retrievedBOGOs.length).equals(1);
    expect(retrievedBOGOs[0].id).equals(bogo.id);
    expect(retrievedBOGOs[0].qualifier.price).equals(fruit1.price);
    expect(retrievedBOGOs[0].reward.price).equals(fruit2.price);
});

test("Can persist and retrieve Discount", async () => {
    const discount = new Discount(2);
    
    const cart = new Cart();
    await cart.addItem(new Fruit(2));
    
    const cashier = new Cashier("a", "a", cart);
    await Cashier.saveCashier(cashier);
    
    const receipt = new Receipt(cart, cashier, Temporal.Now.instant());
    await Receipt.saveReceipt(receipt);
    
    await discount.saveCoupon(receipt.id!);
    expect(discount.id).toBeDefined();
    
    const retrievedDiscounts = await Discount.getDiscount(receipt.id!);
    expect(retrievedDiscounts.length).equals(1);
    expect(retrievedDiscounts[0].id).equals(discount.id);
    expect(retrievedDiscounts[0].amount).equals(discount.amount);
});
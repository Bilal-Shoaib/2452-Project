import type { Temporal } from "@js-temporal/polyfill";
import { assert } from "../assertions.ts";
import { InvalidCheckoutException } from "./cart.ts";

import type Coupon from "./Coupon/coupon.ts";
import type Listener from "./listener.ts";
import type Cart from "./cart.ts";
import type Cashier from "./cashier.ts";
import ProductWithQuantity from "./Product/product-with-quantity.ts";

import db from "./connection.ts";

/**
 * Represents a receipt generated after a customer checks out their cart.
 * It contains information about the purchased items, the cashier who processed the transaction,
 * the timestamp of the transaction, and any applied coupons or discounts.
 * @property {Cart} cart - The shopping cart associated with the receipt.
 * @property {Cashier} cashier - The cashier who processed the checkout.
 * @property {Temporal.Instant} timestamp - The timestamp of when the receipt was generated.
 * @property {number} totalCost - The total cost of the items in the cart before any savings.
 * @property {number} total - The total cost of the items in the cart after any discounts are applied.
 * @property {Array<Coupon>} appliedCoupons - An array of coupons that have been applied to the receipt.
 * @throws {InvalidCheckoutException} If the cart is empty when attempting to create a receipt, as a receipt cannot be generated for an empty cart.
 */
export default class Receipt {
    
    readonly cart: Cart;
    readonly cashier: Cashier;
    readonly timestamp: Temporal.Instant;
    
    readonly totalCost: number;
    #totalSavings: number;

    readonly appliedCoupons: Array<Coupon>;

    #listeners: Array<Listener>;
    
    public id?: number;

    constructor(cart: Cart, cashier: Cashier, timestamp: Temporal.Instant) {
        
        if (cart.isEmpty()) {
            throw new InvalidCheckoutException();
        }

        this.cart = cart;
        this.cashier = cashier;
        this.timestamp = timestamp;

        this.totalCost = Receipt.calculateTotal(cart);
        this.#totalSavings = 0;

        this.appliedCoupons = new Array<Coupon>();

        this.#listeners = new Array<Listener>();

        this.#checkReceipt();
    }

    /**
     * Applies a coupon to the receipt by adding it to the list of applied coupons, 
     * and updating the total savings accordingly. 
     * It then notifies all listeners of the change.
     * @param coupon the coupon to be applied to this receipt.
     * @throws {AssertionError} If the coupon being applied is already in the list of applied coupons for this receipt.
     */
    public applyCoupon(coupon: Coupon): void {

        assert(!this.appliedCoupons.includes(coupon), "The coupon being applied cannot already be in the list of applied coupons for this receipt.");

        if (this.#totalSavings + coupon.calculateSavings() > this.totalCost) {
            throw new CannotApplyCouponException();
        }

        this.appliedCoupons.push(coupon);

        this.#totalSavings += coupon.calculateSavings();

        this.#notifyAll();
        this.#checkReceipt();
    }

    /**
     * Gets the total cost of the items in the cart after any discounts are applied.
     * @returns {number} The total cost of the items in the cart after any discounts are applied.
     * @throws {AssertionError} If the net payable amount is negative, as the total cost after applying discounts should always be a non-negative number.
     */
    public get total(): number {
        const payableAmount = this.totalCost - this.#totalSavings;
        assert(payableAmount >= 0, "The net payable amount must be non-negative after applying discounts.");

        return payableAmount;
    }

    /**
     * Adds a listener to an array of listeners.
     * @param {Listener} listener - is being added to the list of listeners.
     */
    public registerListener(listener: Listener): void {

        //no need to check if the listener is null, typescript does not allow it to be null

        this.#listeners.push(listener);

        //no post conditions to check, the 'non-null' listener is added to the listeners array
    }

    /**
     * Iterates through an array of listeners and calls the `notify` method on each listener.
     */
    #notifyAll(): void {

        //no need to check if the listeners array is null,
        // it is initialized in the constructor and cannot be null

        for (const listener of this.#listeners) {
            listener.notify();
        }
    } 

    /**
     * Validates the state of the receipt by ensuring that the cart is not empty.
     * Validates that the total cost and total savings are non-negative numbers, 
     * and that the total savings do not exceed the total cost.
     * @throws {AssertionError} If any of the above conditions are not met.
     */
    #checkReceipt() {
        assert(!this.cart.isEmpty(), "A receipt can never store an empty cart.");
        assert(this.totalCost >= 0, "Total cost must be a non-negative number.");
        assert(this.#totalSavings >= 0, "Total savings must be a non-negative number.");
        assert(this.#totalSavings <= this.totalCost, "Total savings cannot exceed total cost.");
    }

    /**
     * Calculates the total cost of the items in the cart by iterating through each product and summing their prices.
     * @param {Cart} cart - The shopping cart containing the products for which to calculate the total cost.
     * @returns {number} The total cost of the items in the cart.
     * @throws {AssertionError} If the calculated total cost is negative, as total cost should always be a non-negative number.
     */
    private static calculateTotal(cart: Cart): number {

        //this method is not a mutator, no preconditions or postconditions are needed

        let sum = 0;
        
        for (const item of cart) {
            if (item instanceof ProductWithQuantity) {
                sum += item.totalPrice();
            } else {
                sum += item.price;
            }
            
        }

        //sum was initialized to 0 and incremented by the price of each item,
        //  so it should always be a non-negative number
        assert(sum >= 0, "Total price must be a non-negative number");

        return sum;
    }

    /**
     * Saves the receipt to the database, along with any applied coupons.
     * @param {Receipt} receipt - The receipt to be saved to the database.
     * @returns {Promise<Receipt>} A promise that resolves to the saved receipt with an assigned ID.
     * @throws {AssertionError} If the cart associated with the receipt does not have an ID 
     * or if the receipt could not be saved to the database.
     */
    public static async saveReceipt(receipt: Receipt): Promise<Receipt> {

        assert(receipt.cart.id != undefined, "The cart must have an id before a receipt is persisted for that cart.");

        const results = await db().query<{id: number}>(
            "insert into receipt(id, time_stamp, cart_id, cashier_name) values(default, $1, $2, $3) on conflict do nothing returning id",
            [receipt.timestamp.toString(), receipt.cart.id!, receipt.cashier.name]
        )

        if (receipt.id == undefined) {
            receipt.id = results.rows[0].id;
        }

        for (const coupon of receipt.appliedCoupons) {
            await coupon.saveCoupon(receipt);
        }

        assert(receipt.id != undefined, "After saving the receipt to the database, it should have an id assigned.");

        return receipt;
    }

}

export class CannotApplyCouponException extends Error {}
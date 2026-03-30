import type { Temporal } from "@js-temporal/polyfill";
import { assert } from "../assertions.ts";
import type Cart from "./cart.ts";
import type Cashier from "./cashier.ts";
import { InvalidCheckoutException } from "./cart.ts";
import db from "./connection.ts";
import type Coupon from "./Coupon/coupon.ts";
import type Product from "./Product/product.ts";
import Discount from "./Coupon/discount.ts";
import BOGO from "./Coupon/bogo.ts";
import type Listener from "./listener.ts";

/**
 * The DiscountThreshold class is only used within the Receipt class to represent
 * a discount threshold amount a it's corresponding discount percantage.
 * @property {number} cost - The minimum total cost required to qualify for the discount.
 * @property {number} discountPercent - The percentage of the total cost that will be discounted if the threshold is met.
 */
class DiscountThreshold {

    readonly cost: number;
    readonly discountPercent: number;
    
    constructor(cost: number, discountPercent: number) {
        this.cost = cost;
        this.discountPercent = discountPercent;
    }
}

/**
 * The Receipt class represents a receipt generated after a customer checks out their cart.
 * It contains information about the purchased items, the cashier who processed the transaction,
 * the timestamp of the transaction, and any applied coupons or discounts.
 * @property {Cart} cart - The shopping cart associated with the receipt.
 * @property {Cashier} cashier - The cashier who processed the checkout.
 * @property {Temporal.Instant} timestamp - The timestamp of when the receipt was generated.
 * @property {number} total - The total cost of the items in the cart after any discounts are applied.
 * @property {Array<Coupon>} availableCoupons - An array of coupons that are available for the receipt based on the items in the cart and the total cost.
 * @property {Array<Coupon>} appliedCoupons - An array of coupons that have been applied to the receipt.
 * @throws {InvalidCheckoutException} If the cart is empty when attempting to create a receipt, as a receipt cannot be generated for an empty cart.
 */
export default class Receipt {

    private static DISCOUNT_THRESHOLDS: DiscountThreshold[] = [
        //multiples of 4 result in an integer when muliplied by one of the 'quarterly' percentages
            //where we define a 'quarterly' percentage as percentages that are multiples of 25.
        new DiscountThreshold(4, 0.25),
        new DiscountThreshold(16, 0.50),
        new DiscountThreshold(32, 0.75)
    ];
    
    readonly cart: Cart;
    readonly cashier: Cashier;
    readonly timestamp: Temporal.Instant;
    
    #totalCost: number;
    #totalDiscount: number;

    readonly appliedCoupons: Array<Coupon>;
    readonly availableCoupons: Array<Coupon>;

    #listeners: Array<Listener>;
    
    public id?: number;

    constructor(cart: Cart, cashier: Cashier, timestamp: Temporal.Instant) {
        
        if (cart.isEmpty()) {
            throw new InvalidCheckoutException();
        }

        this.cart = cart;
        this.cashier = cashier;
        this.timestamp = timestamp;

        this.#totalCost = Receipt.calculateTotal(cart);
        this.#totalDiscount = 0;

        this.appliedCoupons = new Array<Coupon>();
        this.availableCoupons = Receipt.getAvailableCoupons(this);

        this.#listeners = new Array<Listener>();

        this.#checkReceipt();
    }

    /**
     * Applies a coupon to the receipt by adding it to the list of applied coupons, 
     * removing it from the list of available coupons, and updating the total discount accordingly. 
     * It then notifies all listeners of the change.
     * @param coupon the coupon to be applied to this receipt.
     * @throws {AssertionError} If the coupon being applied is not in the list of available coupons for this receipt, 
     * or if it is already in the list of applied coupons for this receipt.
     */
    public applyCoupon(coupon: Coupon): void {

        assert(this.availableCoupons.includes(coupon), "The coupon being applied must be in the list of available coupons for this receipt.");
        assert(!this.appliedCoupons.includes(coupon), "The coupon being applied cannot already be in the list of applied coupons for this receipt.");

        if (this.#totalDiscount + coupon.amount > this.#totalCost) {
            throw new CannotApplyCouponException();
        }

        this.appliedCoupons.push(coupon);
        this.availableCoupons.splice(this.availableCoupons.indexOf(coupon), 1);

        this.#totalDiscount += coupon.amount;

        this.#notifyAll();
        this.#checkReceipt();
    }

    /**
     * Gets the total cost of the items in the cart after any discounts are applied.
     * @returns {number} The total cost of the items in the cart after any discounts are applied.
     * @throws {AssertionError} If the net payable amount is negative, as the total cost after applying discounts should always be a non-negative number.
     */
    public get total(): number {
        const payableAmount = this.#totalCost - this.#totalDiscount;
        assert(payableAmount >= 0, "The net payable amount must be non-negative after applying discounts.");

        return payableAmount;
    }

    /**
     * The function `registerListener` adds a listener to an array of listeners.
     * @param {Listener} listener - is being added to the list of listeners.
     */
    public registerListener(listener: Listener): void {

        //no need to check if the listener is null, typescript does not allow it to be null

        this.#listeners.push(listener);

        //no post conditions to check, the 'non-null' listener is added to the listeners array
    }

    /**
     * The `#notifyAll` function iterates through an array of listeners and calls the `notify` method on each listener.
     * This is typically used in the observer pattern to notify all observers of a change in state.
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
     * Validates that the total cost and total discount are non-negative numbers, 
     * and that the total discount does not exceed the total cost.
     * @throws {AssertionError} If any of the above conditions are not met.
     */
    #checkReceipt() {
        assert(!this.cart.isEmpty(), "A receipt can never store an empty cart.");
        assert(this.#totalCost >= 0, "Total cost must be a non-negative number.");
        assert(this.#totalDiscount >= 0, "Total discount must be a non-negative number.");
        assert(this.#totalDiscount <= this.#totalCost, "Total discount cannot exceed total cost.");
    }

    /**
     * The `getAvailableCoupons` function generates a list of coupons that are applicable to the receipt based on the items in the cart and the total cost.
     * It checks for valid discounts based on predefined thresholds and valid BOGO offers based on the products in the cart.
     * @param {Receipt} receipt - The receipt for which to calculate the available coupons.
     * @returns {Array<Coupon>} An array of coupons that are available for the receipt.
     */
    private static getAvailableCoupons(receipt: Receipt): Array<Coupon> {
        const coupons = new Array<Coupon>();

        //add any applicable discount first, only one discount allowed
        Receipt.addValidDiscounts(receipt.#totalCost, coupons);
        
        //now check for any eligible bogos and add them
        Receipt.addValidBOGOs(receipt.cart, coupons);

        return coupons;

    }

    /**
     * The `addValidDiscounts` function checks if the total cost of the receipt meets any predefined discount thresholds and adds the corresponding discount coupons to the provided array.
     * It iterates through the discount thresholds in descending order and applies the first applicable discount based on the total cost.
     * @param {number} totalCost - The total cost of the receipt before discounts.
     * @param {Array<Coupon>} coupons - The array to which valid discount coupons will be added.
     */
    private static addValidDiscounts(totalCost: number, coupons: Array<Coupon>): void {
        let discountApplied = false;
        let i = Receipt.DISCOUNT_THRESHOLDS.length-1;
        
        while(!discountApplied && i >= 0) {
            const threshold = Receipt.DISCOUNT_THRESHOLDS.at(i)!;
            
            if (totalCost >= threshold.cost) {
                const amountDiscounted = totalCost * threshold.discountPercent;
                coupons.push(new Discount(amountDiscounted));
                discountApplied = true;
            }
            
            i--;
        }
    }

    /**
     * The `addValidBOGOs` function checks for valid BOGO (Buy One Get One) offers based on the products in the cart and adds the corresponding BOGO coupons to the provided array.
     * It uses a map to group products by their type and price, and identifies valid BOGO pairs to create BOGO coupons.
     * @param {Cart} cart - The shopping cart containing the products to check for BOGO offers.
     * @param {Array<Coupon>} coupons - The array to which valid BOGO coupons will be added.
     */
    private static addValidBOGOs(cart: Cart, coupons: Array<Coupon>): void {
        //? Use a string key because JavaScript Maps compare object keys by reference,
        //? not by value (no .equals() like Java). This ensures correct grouping.
        const productMap = new Map<string, Array<Product>>();

        for (const item of cart) {

            const mapKey = `${item.constructor.name}-${item.price}`;
            
            if (productMap.has(mapKey)) {
            
                const bogoPair = productMap.get(mapKey);
            
                if (bogoPair!.length <= 1 && bogoPair!.at(0)!.id! != item.id!) {
                    coupons.push(new BOGO(bogoPair!.at(0)!, item));
                    bogoPair!.push(item);
                }
            
            } else {
                productMap.set(mapKey, [item]);
            }
        }

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
            sum += item.price;
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
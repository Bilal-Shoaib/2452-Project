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

class DiscountThreshold {

    readonly cost: number;
    readonly discountPercent: number;
    
    constructor(cost: number, discountPercent: number) {
        this.cost = cost;
        this.discountPercent = discountPercent;
    }
}

/** 
 * The `Receipt` class in TypeScript provides methods to summarize items based on type and calculate 
 * the total price of all items in a collection. 
 */
export default class Receipt {

    private static DISCOUNT_THRESHOLDS: DiscountThreshold[] = [
        //multiples of 4 result in an integer when muliplied by one of the 'quarterly' percentages
            //where we define a 'quarterly' percentage as percentages that are multiples of 25.
        new DiscountThreshold(4, 0.25),
        new DiscountThreshold(10, 0.50),
        new DiscountThreshold(16, 0.75)
    ];
    
    readonly cart: Cart;
    readonly cashier: Cashier;
    readonly timestamp: Temporal.Instant;
    
    #totalCost: number;
    #totalDiscount: number;

    #appliedCoupons: Array<Coupon>;
    #availableCoupons: Array<Coupon>;

    #listeners: Array<Listener>;
    
    id?: number;

    constructor(cart: Cart, cashier: Cashier, timestamp: Temporal.Instant) {
        
        if (cart.isEmpty()) {
            throw new InvalidCheckoutException();
        }

        this.cart = cart;
        this.cashier = cashier;
        this.timestamp = timestamp;

        this.#totalCost = Receipt.calculateTotal(cart);
        this.#totalDiscount = 0;

        this.#appliedCoupons = new Array<Coupon>();
        this.#availableCoupons = Receipt.getAvailableCoupons(this);

        this.#listeners = new Array<Listener>();

        this.#checkReceipt();
    }

    public applyCoupon(coupon: Coupon): void {
        this.#appliedCoupons.push(coupon);
        this.#availableCoupons = this.#availableCoupons.filter(item => item !== coupon);

        this.#totalDiscount += coupon.amount;

        this.#notifyAll();
    }

    public get total(): number {
        const payableAmount = this.#totalCost - this.#totalDiscount;
        assert(payableAmount >= 0, "The net payable amount must be non-negative after applying discounts.");

        return payableAmount;
    }

    public get availableCoupons(): Array<Coupon> {
        return this.#availableCoupons;
    }

    public get appliedCoupons(): Array<Coupon> {
        return this.#appliedCoupons;
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
     * The `notifyAll` function iterates through all listeners and calls the `notify` method on each
     * one.
     */
    #notifyAll(): void {

        //no need to check if the listeners array is null,
        // it is initialized in the constructor and cannot be null

        for (const listener of this.#listeners) {
            listener.notify();
        }
    } 

    #checkReceipt() {
        assert(!this.cart.isEmpty(), "A receipt can never store an empty cart.");
    }

    private static getAvailableCoupons(receipt: Receipt): Array<Coupon> {
        const coupons = new Array<Coupon>();

        //add any applicable discount first, only one discount allowed
        Receipt.addValidDiscounts(receipt.#totalCost, coupons);
        
        //now check for any eligible bogos and add them
        Receipt.addValidBOGOs(receipt.cart, coupons);

        return coupons;

    }

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

    public static async saveReceipt(receipt: Receipt): Promise<Receipt> {

        assert(receipt.cart.id != undefined, "The cart must have an id before a receipt is persisted for that cart.");

        const results = await db().query<{id: number}>(
            "insert into receipt(id, time_stamp, cart_id, cashier_name) values(default, $1, $2, $3) on conflict do nothing returning id",
            [receipt.timestamp.toString(), receipt.cart.id!, receipt.cashier.name]
        )

        if (receipt.id == undefined) {
            receipt.id = results.rows[0].id;
        }

        for (const coupon of receipt.#appliedCoupons) {
            await coupon.saveCoupon(receipt.id!);
        }

        return receipt;
    }

}
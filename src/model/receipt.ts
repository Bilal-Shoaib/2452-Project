import type { Temporal } from "@js-temporal/polyfill";
import { assert } from "../assertions";


import type Cart from "./cart";
import type Cashier from "./cashier";
import { InvalidCheckoutException } from "./cart";

/** 
 * The `Receipt` class in TypeScript provides methods to summarize items based on type and calculate 
 * the total price of all items in a collection. 
 */
export default class Receipt {
    readonly cart: Cart;
    readonly cashier: Cashier;
    readonly timestamp: Temporal.Instant;

    constructor(cart: Cart, cashier: Cashier, timestamp: Temporal.Instant) {
        
        if (cart.isEmpty()) {
            throw new InvalidCheckoutException();
        }

        this.cart = cart;
        this.cashier = cashier;
        this.timestamp = timestamp;
    }
    
    /**
     * The function calculates the total price of all items in a collection.
     * @returns  the sum of prices of all items in the `#items` array.
     */
    public get total(): number {

        //this method is not a mutator, no preconditions or postconditions are needed

        let sum = 0;
        
        for (const item of this.cart) {
            sum += item.price;
        }

        //sum was initialized to 0 and incremented by the price of each item,
        //  so it should always be a non-negative number
        assert(sum >= 0, "Total price must be a non-negative number");

        return sum;
    }

}
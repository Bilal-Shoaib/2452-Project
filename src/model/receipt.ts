import { assert } from "../assertions";

import Cart from "./cart";

/** 
 * The `Receipt` class in TypeScript provides methods to summarize items based on type and calculate 
 * the total price of all items in a collection. 
 */
export default class Receipt {
    readonly #items: Cart;

    constructor(items: Cart) {
        this.#items = items;
    }

    /**
     * This function returns the Cart object.
     * @returns The cart's `items`.
     */
    public get items(): Cart {
        return this.#items;
    }
    
    /**
     * The function calculates the total price of all items in a collection.
     * @returns  the sum of prices of all items in the `#items` array.
     */
    public get total(): number {

        //this method is not a mutator, no preconditions or postconditions are needed

        let sum = 0;
        
        for (const item of this.#items) {
            sum += item.price;
        }

        //sum was initialized to 0 and incremented by the price of each item,
        //  so it should always be a non-negative number
        assert(sum >= 0, "Total price must be a non-negative number");

        return sum;
    }

}
import { assert } from "../assertions";

import Cart, { InvalidCheckoutException } from "./cart";

/** 
 * The `Receipt` class in TypeScript provides methods to summarize cart based on type and calculate 
 * the total price of all cart in a collection. 
 */
export default class Receipt {
    readonly cart: Cart;

    constructor(cart: Cart) {

        //we have not allowed a receipt to be created for an empty cart by convention
        //  this responsibility is an invariant of the receipt class
        if (cart.isEmpty()) {
            throw new InvalidCheckoutException();
        }

        this.cart = cart;
    }
    
    /**
     * The function calculates the total price of all cart in a collection.
     * @returns  the sum of prices of all cart in the `cart` array.
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
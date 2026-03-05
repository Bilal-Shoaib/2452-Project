import Product from "./product.ts";

import { InvalidPriceException } from "./product.ts";
import { assert } from "../../assertions.ts";

/**
 * The `Fruit` class in TypeScript represents a product with a private 
 * price property that must be non-negative.
 */
export default class Fruit extends Product {
    #price: number;

    constructor(price: number) {
        super();
        this.#price = price;

        if (this.#price < 0) {
            throw new InvalidPriceException();
        }

        this.#checkFruit();
    }

    /**
     * This function returns the price of an item.
     * @returns The `price` property of the object is being returned as a number.
     */
    get price() : number {

        //this method is not a mutator, no preconditions or postconditions are needed

        return this.#price;
    }

    /**
     * The function `checkFruit` ensures that the price of a fruit is non-negative.
     */
    #checkFruit(): void {
        assert(this.#price >= 0, "Price must be non-negative.");
    }
}


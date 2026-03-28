import Product from "./product.ts";

/**
 * The `Vegetable` class in TypeScript represents a product with a
 * price property that must be non-negative.
 */
export default class Vegetable extends Product {

    constructor(price: number) {
        super(price);
    }

}
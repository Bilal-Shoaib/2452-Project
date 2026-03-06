import Product from "./product.ts";

/**
 * The `Fruit` class in TypeScript represents a product with a 
 * price property that must be non-negative.
 */
export default class Fruit extends Product {

    constructor(price: number) {
        super(price);
    }
    
}


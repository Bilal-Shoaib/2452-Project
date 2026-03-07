import ProductFactory from "./factory.ts";
import Product from "./product.ts";

/**
 * The `Fruit` class in TypeScript represents a product with a 
 * price property that must be non-negative.
 */
export default class Fruit extends Product {

    constructor(price: number) {
        super(price);
    }

    //! two type getter methods look bad? is this okayish or are there better practices?
    //! same for other product subclasses
    public static get type(): string {
        return "Fruit";
    }

    public get type(): string {
        return Fruit.type;
    }
    
}

ProductFactory.register(Fruit.type, Fruit);
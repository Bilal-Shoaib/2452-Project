import Product from "./product.ts";
import Factory from "./Factory/factory.ts";

/**
 * The `Fruit` class in TypeScript represents a product with a 
 * price property that must be non-negative.
 */
export default class Fruit extends Product {

    public static readonly type = "Fruit";

    constructor(price: number) {
        super(price);
    }
    
    public clone(): Fruit {
        return new Fruit(this.price.valueOf());
    }
    
    public static async register() {
        Factory.register(this.type, Fruit);
    }

}
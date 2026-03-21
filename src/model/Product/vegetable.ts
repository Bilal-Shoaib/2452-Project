import Product from "./product.ts";
import Factory from "./Factory/factory.ts";

/**
 * The `Vegetable` class in TypeScript represents a product with a
 * price property that must be non-negative.
 */
export default class Vegetable extends Product {

    public static readonly type = "Vegetable";


    constructor(price: number) {
        super(price);
    }
    
    public clone(): Vegetable {
        return new Vegetable(this.price.valueOf());
    }
    
    public static async register() {
        Factory.register(this.type, Vegetable);
    }
    
}

import Product from "./product.ts";
import Factory from "./Factory/factory.ts";

/**
 * Represents a vegetable product with a price property and clonable behavior.
 * @extends {Product}
 */
export default class Vegetable extends Product {

    public static readonly type = "Vegetable";

    constructor(price: number) {
        super(price);
    }
    
    /**
     * Creates a clone of the current Vegetable instance.
     * @returns {Vegetable} A new instance of Vegetable with the same price.
     */
    public clone(): Vegetable {
        return new Vegetable(this.price.valueOf());
    }
    
    /**
     * Registers the Vegetable class with the Factory for later instantiation.
     * This method should be called to ensure that the Factory can create instances of Vegetable.
     */
    public static async register() {
        Factory.register(this.type, Vegetable);
    }
    
}

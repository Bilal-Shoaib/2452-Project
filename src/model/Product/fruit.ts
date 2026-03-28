import Product from "./product.ts";
import Factory from "./Factory/factory.ts";

/** 
 * Represents a fruit product with a price property and clonable behavior.
 * @extends {Product}
 */
export default class Fruit extends Product {

    public static readonly type = "Fruit";

    constructor(price: number) {
        super(price);
    }

    /**
     * Creates a clone of the current Fruit instance.
     * @returns {Fruit} A new instance of Fruit with the same price.
     */
    public clone(): Fruit {
        return new Fruit(this.price.valueOf());
    }
    
    /**
     * Registers the Fruit class with the Factory for later instantiation.
     * This method should be called to ensure that the Factory can create instances of Fruit.
     */
    public static async register() {
        Factory.register(this.type, Fruit);
    }

}
import ProductFactory from "./factory.ts";
import Product from "./product.ts";

/**
 * The `Vegetable` class in TypeScript represents a product with a
 * price property that must be non-negative.
 */
export default class Vegetable extends Product {

    constructor(price: number) {
        super(price);
    }

    public static get type(): string {
        return "Vegetable";
    }

    public get type(): string {
        return Vegetable.type;
    }

}

ProductFactory.register(Vegetable.type, Vegetable);

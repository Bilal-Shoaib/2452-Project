import { assert } from "../../../assertions";
import type Product from "../product";

type ProductConstructor = new (price: number) => Product;

/**
 * Factory class for creating Product instances.
 * It maintains a registry of product types and their corresponding constructors.
 * The factory allows for dynamic creation of products based on their type and price.
 */
export default class Factory {
    static registry = new Map<string, ProductConstructor>();

    /**
     * Registers a product type with its constructor in the factory registry.
     * @param type - The unique identifier for the product type.
     * @param constructor - The constructor function for creating instances of the product type.
     * @throws {AssertionError} if the product type is already registered.
     */
    public static register(type: string, constructor: ProductConstructor): void {
        assert(this.registry.get(type) == undefined, `Product ${type} must be not be registered to the Product Factory when registering.`);

        this.registry.set(type, constructor);
    }

    /**
     * Creates an instance of a product based on the specified type and price.
     * @param type - The unique identifier for the product type to create.
     * @param price - The price to be set for the created product instance.
     * @return A new instance of the specified product type with the given price.
     * @throws {AssertionError} if the product type is not registered in the factory.
     */
    public static get(type: string, price: number): Product {
        assert(this.registry.get(type) != undefined, `Product ${type} must be registered to the Product Factory when creating instances.`);
        
        const constructor = this.registry.get(type)!;
        return new constructor(price).clone();
    }

}
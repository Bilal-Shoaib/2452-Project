import { assert } from "../../assertions";

import Product from "./product";

/**
 * Represents a product with a quantity property. This class extends the Product class and adds a quantity property to represent the quantity of the product.
 * @abstract
 * @extends Product
 * @property {number} quantity - The quantity of the product, which must be non-negative.
 * @throws {InvalidProductQuantityException} If the quantity is negative.
 */
export default abstract class ProductWithQuantity extends Product {

    public static readonly MG_PER_UNIT = 100; // 100 mg per unit of product with quantity

    #quantity: number;

    constructor(price: number, quantity: number) {
        super(price);
        if (quantity < 0) {
            throw new InvalidProductQuantityException();
        }
        this.#quantity = quantity;

        this.#checkProductWithQuantity();
    }

    /**
     * Gets the quantity of the product.
     * @returns {number} The quantity of the product.
     */
    public get quantity(): number {
        return this.#quantity;
    }

    /**
     * Sets the quantity of the product. The quantity must be non-negative, otherwise an InvalidProductQuantityException is thrown.
     * @param quantity - The new quantity to be set for the product.
     * @throws {InvalidProductQuantityException} If the quantity is negative.
     */
    public set quantity(quantity: number) {
        if (quantity < 0) {
            throw new InvalidProductQuantityException();
        }
        this.#quantity = quantity;

        this.#checkProductWithQuantity();
    }

    /**
     * Calculates the total price of the product based on its quantity.
     * @returns {number} The total price of the product based on its quantity.
     */
    public totalPrice(): number {
        return super.price*(this.quantity/ProductWithQuantity.MG_PER_UNIT);
    }

    /**
     * Creates a clone of the product with quantity.
     * This method must be implemented by subclasses to provide specific cloning behavior for products with quantity.
     * @abstract
     * @returns {ProductWithQuantity} A clone of the product with quantity.
     */
    abstract clone(): ProductWithQuantity;

    /**
     * Validates the product's quantity. This method checks if the quantity is non-negative and throws an assertion error if it is not.
     * @throws {AssertionError} if the quantity is negative.
     */
    #checkProductWithQuantity() {
        assert(this.#quantity >= 0, "Product quantity must be greater than zero.");
    }
}

export class InvalidProductQuantityException extends Error {}
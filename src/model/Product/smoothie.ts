import Product from "./product";
import Factory from "./Factory/factory";
import { assert } from "../../assertions";

/**
 * Represents a smoothie product.
 * @extends Product
 * @property {number} quantity - The quantity of the smoothie.
 * @throws {InvalidSmoothieQuantityException} If the quantity is negative.
 */
export default class Smoothie extends Product {
    
    public static readonly type = "Smoothie";

    #quantity?: number;

    constructor(price: number) {
        super(price);
    }

    /**
     * Creates a clone of the current smoothie instance.
     * @returns {Smoothie} A new instance of Smoothie with the same price and quantity.
     */
    public clone(): Smoothie {
        const copy = new Smoothie(this.price.valueOf());
        copy.#quantity = this.#quantity;
        return copy;
    }

    /**
     * Sets the quantity of the smoothie.
     * @param {number} quantity - The quantity to set. Must be a non-negative number.
     * @throws {InvalidSmoothieQuantityException} If the quantity is negative.
     * @throws {AssertionError} If the quantity is not a non-negative number.
     */
    public set quantity(quantity: number) {
        if (quantity < 0) {
            throw new InvalidSmoothieQuantityException();
        }
        this.#quantity = quantity;

        assert(this.#quantity >= 0, "Quantity must be a non-negative number.");
    }

    /**
     * Gets the quantity of the smoothie.
     * @returns {number | undefined} The quantity of the smoothie, or undefined if it has not been set.
     */
    public get quantity(): number | undefined {
        return this.#quantity;
    }
    
    /**
     * Registers the Smoothie class with the Factory.
     * This method should be called to ensure that the Factory can create instances of Smoothie.
     */
    public static async register() {
        Factory.register(this.type, Smoothie);
    }

}

export class InvalidSmoothieQuantityException extends Error {}


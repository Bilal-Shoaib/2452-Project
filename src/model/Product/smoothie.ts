import ProductWithQuantity from "./product-with-quantity.ts";
import Factory from "./Factory/factory";

/**
 * Represents a smoothie product.
 * @extends ProductWithQuantity
 * @property {number} quantity - The quantity of the smoothie.
 * @throws {InvalidProductQuantityException} If the quantity is negative.
 */
export default class Smoothie extends ProductWithQuantity {
    
    public static readonly type = "Smoothie";
    private static readonly MG_PER_UNIT = 100; // 100 mg per unit of smoothie

    constructor(price: number, quantity: number) {
        super(price, quantity);
    }

    /**
     * Creates a clone of the smoothie product. This method returns a new instance of the Smoothie class with the same price and quantity as the original.
     * @returns {Smoothie} A clone of the smoothie product.
     */
    public clone(): Smoothie {
        return new Smoothie(this.price, this.quantity);
    }

    public get price(): number {
        return super.price*(this.quantity/Smoothie.MG_PER_UNIT);
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


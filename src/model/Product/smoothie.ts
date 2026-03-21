import Product from "./product";
import Factory from "./Factory/factory";

export default class Smoothie extends Product {
    
    public static readonly type = "Smoothie";

    #quantity?: number;

    constructor(price: number) {
        super(price);
    }

    public clone(): Smoothie {
        const copy = new Smoothie(this.price);
        copy.#quantity = this.#quantity;
        return copy;
    }

    public set quantity(quantity: number) {
        if (quantity < 0) {
            throw new InvalidSmoothieQuantityException();
        }
        this.#quantity = quantity;
    }

    public get quantity(): number | undefined {
        return this.#quantity;
    }
    
    public static async register() {
        Factory.register(this.type, Smoothie);
    }

}

export class InvalidSmoothieQuantityException extends Error {}


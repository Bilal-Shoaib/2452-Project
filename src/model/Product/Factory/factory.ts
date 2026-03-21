import { assert } from "../../../assertions";
import type Product from "../product";

type ProductConstructor = new (price: number) => Product;

export default class Factory {
    static registry = new Map<string, ProductConstructor>();

    public static register(type: string, constructor: ProductConstructor): void {
        assert(this.registry.get(type) == undefined, `Product ${type} must be not be registered to the Product Factory when registering.`);

        this.registry.set(type, constructor);
    }

    public static get(type: string, price: number): Product {
        assert(this.registry.get(type) != undefined, `Product ${type} must be registered to the Product Factory when creating instances.`);
        
        const constructor = this.registry.get(type)!;
        return new constructor(price).clone();
    }

}
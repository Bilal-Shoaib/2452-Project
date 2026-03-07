import { assert } from "../../assertions";

import Product from "./product";
import db from "../connection.ts"

//! we did not discuss the factory pattern in class 
//! at all, is this okay to use for ocp?

//? with the help of this, when adding a new product we only need to
//?     1. add it to the database
//?     2. register it to the factory

type ProductConstructor = new (price: number) => Product;

class FactoryItem {

    readonly price: number;
    readonly creator: ProductConstructor;

    constructor(price: number, creator: ProductConstructor) {
        this.price = price;
        this.creator = creator;
    }
}

export default class ProductFactory {
    private static registry = new Map<string, FactoryItem>();

    public static async register(type: string, creator: ProductConstructor) {
        if (!this.registry.has(type)) {
            const results = await db().query<{price: number}>(
                "select price from inventory where product_type = $1",
                [type]
            );

            //we must assert that the price lookup from inventory was a success
            assert(results.rows.length > 0, `Product type ${type} must have a set price in the database before registering with the ProductFactory.`)
            const price = results.rows[0].price;

            //we will always assume that the prices in the db are non-negative
            assert(price > 0, `Price of ${type} must be non-negative in the database.`)

            this.registry.set(type, new FactoryItem(price, creator));
        }
    }

    public static create(type: string): Product {
        const factoryItem = this.registry.get(type);

        //we can guarantee that the product constructor is never undefined
        assert(factoryItem, `The Product type ${type} must register itself to the ProductFactory.`)
        return new factoryItem.creator(factoryItem.price);
    }

    public static getCreator(type: string): ProductConstructor {
        const factoryItem = this.registry.get(type);

        assert(factoryItem, `The Product type ${type} must register itself to the ProductFactory.`)
        return factoryItem.creator!;
    }

    public static get prices(): Map<string, number> {
        const prices = new Map<string, number>();
        for (let type of this.registry.keys()) {
            //we can assert that the factory items stored are never null
            //  because we just retreived the type from the list of keys, so there
            //  must be an associated value

            prices.set(type, this.registry.get(type)!.price);
        }

        return prices;
    }

    public static get types(): Array<string> {
        return Array.from(this.registry.keys());
    }
}
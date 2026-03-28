import type Product from "../product";
import db from "../../connection";
import Factory from "./factory";
import { assert } from "../../../assertions";

/**
 * ProductList class that maintains a registry of Product instances.
 * It provides a method to populate the registry by fetching product data from the database.
 * The populate method queries the inventory table, creates Product instances using the Factory, and stores them in the registry.
 */
export default class ProductList {
    static readonly registry = new Array<Product>();
   
    /**
     * Populates the product registry by fetching product data from the database.
     * It queries the inventory table for product types and prices, creates Product instances using the Factory, and stores them in the registry.
     * @throws {AssertionError} if a product type from the database is not registered with the Product Factory.
     */
    public static async populate() {
        const results = await db().query<{product_type: string, price: number}>(
            "select * from inventory"
        );

        for (const row of results.rows) {
            const constructor = Factory.registry.get(row.product_type);

            assert(constructor != undefined, `${row.product_type} must be registered with the Product Factory.`);

            const product = new constructor!(row.price);
            
            this.registry.push(product.clone());
        }
    }
}
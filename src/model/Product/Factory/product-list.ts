import { assert } from "../../../assertions";

import type Product from "../product";
import Factory from "./factory";
import ProductWithQuantity from "../product-with-quantity";

import db from "../../connection";

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

            const args = ProductList.getConstructorArguments(row);
            const product = new constructor!(...args);
            
            this.registry.push(product.clone());
        }
    }

    /**
     * Gets the constructor arguments for creating a Product instance 
     * based on the product type and price from the database row.
     * @param row represents a row retrieved from the inventory table in the database
     * @returns list of arguments to be passed to the product constructor
     * @throws {AssertionError} if the product type from the database is not registered with the Product Factory.
     */
    private static getConstructorArguments(row: {product_type: string, price: number}): any[] {
        const args = [];
        args.push(row.price);

        const constructor = Factory.registry.get(row.product_type);

        assert(constructor != undefined, `${row.product_type} must be registered with the Product Factory.`);

        if (constructor!.prototype instanceof ProductWithQuantity) {
            args.push(0); //default quantity of 0 for products in inventory
        }

        return args;
    }
}
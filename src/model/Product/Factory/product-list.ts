import type Product from "../product";
import db from "../../connection";
import Factory from "./factory";
import { assert } from "../../../assertions";

export default class ProductList {
    static readonly registry = new Array<Product>();
    
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
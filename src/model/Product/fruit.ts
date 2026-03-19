import ProductList from "./product-list.ts";
import Product from "./product.ts";
import db from "../connection.ts";

/**
 * The `Fruit` class in TypeScript represents a product with a 
 * price property that must be non-negative.
 */
export default class Fruit extends Product {

    public static readonly type = "Fruit"; 
    private static price = 2;

    constructor(price: number) {
        super(price);
    }
    public clone(): Fruit {
        return new Fruit(this.price);
    }
    public static async register() {
        
        //each subclass is responsible for inserting itself into the database
        await db().query(
            "insert into inventory(product_type, price) values($1, $2) on conflict do nothing",
            [this.type, this.price]
        )

        //each subclass must also register itself to the product list
        ProductList.add(this.type, new Fruit(this.price));
    }

}
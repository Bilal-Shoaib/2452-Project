import { assert } from "../../assertions";

import Cart from "../cart";
import db from '../connection.ts'
import Factory from "./Factory/factory.ts";

/** 
 * An abstract class named `Product.
 * The class has a`price` price property that must be non-negative
 */
export default abstract class Product {
    #price: number;
    public id?: number;
    
    constructor(price: number) {
        if (price < 0) {
            throw new InvalidPriceException();
        }
        
        this.#price = price;
        this.#checkProduct();
    }

    public get price(): number {
        return this.#price;
    }

    /**
     * The function `checkProduct()` ensures that the price of a product is non-negative.
     */
    #checkProduct() {
        assert(this.#price >= 0, "Product price must be non-negative.");
    }

    abstract clone(): Product;

    public static async saveProduct(product: Product, cartID: number): Promise<Product> {
        const results = await db().query<{ id: number }>(
            "insert into product(id, price, product_type, cart_id) values(default, $1, $2, $3) on conflict do nothing returning id",
            [product.price, product.constructor.name, cartID]
        );

        if (!product.id) {
            product.id = results.rows[0].id;
        }

        if ("quantity" in product) {
            await db().query(
                "update product set quantity = $1 where id = $2",
                [product.quantity, product.id!]
            );
        }

        return product;
    }

    public static async getProducts(cart: Cart): Promise<Cart> {

        const results = await db().query<{id: number, price: number, product_type: string, quantity: number}>(
            "select * from product where cart_id = $1",
            [cart.id]
        );

        for (let row of results.rows) {
            const product = Factory.get(row.product_type, row.price);
            product.id = row.id;
            
            if ("quantity" in product) {
                product.quantity = row.quantity;
            }

            cart.addItem(product);
        }

        return cart;
    }

}

//custom exception for invalid price
export class InvalidPriceException extends Error {}
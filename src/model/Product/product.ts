import { assert } from "../../assertions";
import db from '../connection.ts'

import Cart from "../cart";
import ProductFactory from "./factory.ts";
/** 
 * An abstract class named `Product.
 * The class has a`price` price property that must be non-negative
 */
export default abstract class Product {
    readonly price: number;
    #id?: number;
    
    constructor(price: number) {
        if (price < 0) {
            throw new InvalidPriceException();
        }
        this.price = price;
        this.#checkProduct();
    }

    public abstract get type(): string

    static async saveProduct(product: Product, cartID: number): Promise<Product> {
        let results = await db().query<{ id: number }>(
            "insert into product(id, price, product_type, cart_id) values(default, $1, $2, $3) on conflict do nothing returning id",
            [product.price, product.type, cartID]
        );

        if (!product.#id) {
            product.#id = results.rows[0].id;
        }

        return product;
    }

    static async getProducts(cart: Cart): Promise<Cart> {

        let results = await db().query<{id: number, product_type: string}>(
            "select id, product_type from product where cart_id = $1",
            [cart.id]
        );

        for (let row of results.rows) {
            const product = ProductFactory.create(row.product_type);
            product.#id = row.id;
            cart.addItem(product);
        }


        return cart;
    }
    
    public get id(): number | undefined {
        return this.#id;
    }

    public set id(id: number) {
        this.#id = id;
    }


    /**
     * The function `checkProduct()` ensures that the price of a product is non-negative.
     */
    #checkProduct() {
        assert(this.price >= 0, "Product price must be non-negative.");
    }
}

//custom exception for invalid price
export class InvalidPriceException extends Error {}
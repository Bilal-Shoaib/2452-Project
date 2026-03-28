import { assert } from "../../assertions";

import Cart from "../cart";
import db from '../connection.ts'
import Factory from "./Factory/factory.ts";

/** 
 * Represents a product with a price property and clonable behavior.
 * @abstract
 * @property {number} price - The price of the product, which must be non-negative.
 * @property {number} [id] - An optional ID for the product, which can be assigned after saving to the database.
 * @abstract@method clone() - An abstract method that must be implemented by subclasses to create a clone of the product.
 */
export default abstract class Product {
    readonly price: number;
    public id?: number;
    
    /**
     * The constructor for the Product class initializes the price of the product and checks its validity.
     * @param {number} price - The price of the product, which must be non-negative.
     * @throws {InvalidPriceException} if the price is negative.
     */
    constructor(price: number) {
        if (price < 0) {
            throw new InvalidPriceException();
        }
        
        this.price = price;
        this.#checkProduct();
    }

    /**
     * Validates the product's price.
     * @throws {AssertionError} if the price is negative.
     */
    #checkProduct() {
        assert(this.price >= 0, "Product price must be non-negative.");
    }

    /**
     * Creates a clone of the product. This method must be implemented by subclasses to provide specific cloning behavior.
     * @abstract
     * @returns {Product} A clone of the product.
     */
    abstract clone(): Product;

    /**
     * Saves the product to the database and associates it with a cart. 
     * If the product does not have an ID, it will be assigned one after insertion. 
     * If the product has a quantity property, it will be updated in the database after insertion.
     * @param {Product} product - The product to be saved.
     * @param {Cart} cart - The cart to which the product belongs.
     * @returns {Promise<Product>} A promise that resolves to the saved product with an assigned ID if it was not already set.
     * @throws {AssertionError} if the cart does not have an ID before saving the product 
     * or if the product ID is not assigned after saving to the database.
     */
    public static async saveProduct(product: Product, cart: Cart): Promise<Product> {

        assert(cart.id !== undefined, "Cart must have an ID before saving a product.");

        const results = await db().query<{ id: number }>(
            "insert into product(id, price, product_type, cart_id) values(default, $1, $2, $3) on conflict do nothing returning id",
            [product.price, product.constructor.name, cart.id!]
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

        assert(product.id !== undefined, "Product ID should be assigned after saving to the database.");

        return product;
    }

    /**
     * Retrieves products associated with a given cart from the database and adds them to the cart.
     * For each product retrieved, it creates an instance using the Factory class based on the product type and price.
     * If the product has a quantity property, it sets the quantity as well.
     * @param {Cart} cart - The cart for which to retrieve products.
     * @returns {Promise<Cart>} A promise that resolves to the cart with the retrieved products added.
     * @throws {AssertionError} if the cart does not have an ID before retrieving products.
     */
    public static async getProducts(cart: Cart): Promise<Cart> {

        assert(cart.id !== undefined, "Cart must have an ID to retrieve products.");

        const results = await db().query<{id: number, price: number, product_type: string, quantity: number}>(
            "select * from product where cart_id = $1",
            [cart.id!]
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

export class InvalidPriceException extends Error {}
import Receipt from "./receipt";
import Product from "./Product/product";
import type Cashier from "./cashier";
import type Listener from "./listener";

import db from './connection.ts';

/**
 * The `Cart` class represents a shopping cart that can hold products 
 * and notify listeners when items are added. It has private properties for 
 * storing products and listeners, and methods for adding items, checking if the cart is empty, 
 * registering listeners, and notifying all listeners when an item is added. 
 * The class also implements a custom iterator to allow iteration over the products in the cart.
 */
export default class Cart {
    readonly cashier: Cashier;
    #id?: number;

    #products: Array<Product>;
    #listeners: Array<Listener>;

    constructor(cashier: Cashier) {
        this.cashier = cashier;

        this.#products = new Array<Product>();
        this.#listeners = new Array<Listener>();
    }

    static async saveCart(cart: Cart): Promise<Cart> {

        if (!cart.#id) {
            let results = await db().query<{ id: number }>(
                "insert into cart(id, cashier_name) values(default, $1) returning id",
                [cart.cashier.name]
            );

            cart.#id = results.rows[0].id;
        }

        //we can guarantee that by the time we get here, cart will have an id for sure :)
        for (let product of cart) {
            if (!product.id) {
                Product.saveProduct(product, cart.#id);
            }
        }
        
        return cart;
    }

    static async getCashiersCart(cashier: Cashier): Promise<Cart> {

        let cart = new Cart(cashier);
        //cart stores a cashier's name as id,
        //we want to find that cart
        const results = await db().query<{ id: number }>(
            "select id from cart where cashier_name = $1",
            [cashier.name]
        );

        //if there is such a cart, we will fill it up
        if (results.rows.length > 0) {
            cart.#id = results.rows[0].id;
            await Product.getProducts(cart);

        //otherwise, we will create a new empty cart
        } else {
            throw new NoCartForCashierException();
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
     * The `checkout` function throws an `InvalidCheckoutException` if the products array
     * is empty, otherwise it returns a new `Receipt` object.
     * @returns A new `Receipt` object.
     * @throws {InvalidCheckoutException} if the cart is empty since checkout
     *      behaviour for an empty cart is undefined.
     */
    public checkout(): Receipt {
        //no need to check if the products array is null,
        // it is initialized in the constructor and cannot be null

        //this cart must be in the database to be checked out
        if (this.#id == undefined) {
            throw new CartNotPersistedException();
        }
        
        return this.cashier.generateReceipt();
    }

    /**
     * The addItem function adds a product to a list and notifies all observers.
     * @param {Product} item - the product that you want to add to the list of products in the class.
     */
    public async addItem(item: Product) {

        //no need to check if the item is null, typescript does not allow it to be null
        //no other validation is needed, the product class should take care of that

        this.#products.push(item);
        
        await Cart.saveCart(this);
        this.#notifyAll();

        //no post conditions to check, the 'non-null' item is added to the products array 
        // and all listeners are notified
    }

    /**
     * The `contains` function checks if a product is in the cart.
     * @param item - the product to check for in the cart
     * @returns boolean indicating if the product is in the cart
     */
    public contains(item: Product): boolean {

        //no need to check if the item is null, typescript does not allow it to be null

        return this.#products.includes(item);
    }

    /**
     * The `isEmpty` function in TypeScript checks if the `products` array is empty and returns a
     * boolean value.
     * @returns The `isEmpty` method is returning a boolean value, specifically `true` if the length of
     * the `products` array is 0, indicating that the array is empty, and `false` otherwise.
     */
    public isEmpty(): boolean {

        //no need to check if the products array is null, 
        // it is initialized in the constructor and cannot be null

        return this.#products.length === 0;
    }

    /**
     * The function `registerListener` adds a listener to an array of listeners.
     * @param {Listener} listener -  is being added to the list of listeners.
     */
    public registerListener(listener: Listener): void {

        //no need to check if the listener is null, typescript does not allow it to be null

        this.#listeners.push(listener);

        //no post conditions to check, the 'non-null' listener is added to the listeners array
    }

    /**
     * The `notifyAll` function iterates through all listeners and calls the `notify` method on each
     * one.
     */
    #notifyAll(): void {

        //no need to check if the listeners array is null,
        // it is initialized in the constructor and cannot be null

        for (const listener of this.#listeners) {
            listener.notify();
        }
    }    

    /**
     * The function defines a custom iterator for a the cart instance
     * I found this to be better than revealing the products array directly.
     * I don't know much typescript so I don't know if this is optimal _:(
     */
    *[Symbol.iterator](): IterableIterator<Product> {
        for (const product of this.#products) {
            yield product;
        }
    }
}

export class InvalidCheckoutException extends Error {}
export class CartNotPersistedException extends Error {}
export class NoCartForCashierException extends Error {}
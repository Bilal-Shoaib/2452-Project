import { Temporal } from "@js-temporal/polyfill";
import { assert } from "../assertions.ts";
import { parseMatrixCSV } from "../utils/parse-markov-model.ts";
import { randomIntInclusive } from "../utils/random-number-generator.ts";

import type Cashier from "./cashier";
import type Listener from "./listener";
import Receipt from "./receipt";
import Product from "./Product/product";
import ProductList from "./Product/Factory/product-list.ts";
import ProductWithQuantity from "./Product/product-with-quantity.ts";

import db from './connection.ts';

/**
 * Represents a shopping cart that can hold products and allows for checkout.
 * It has methods to add items, check if it contains a specific item, check if it's empty, 
 * and register listeners for changes to the cart.
 */
export default class Cart {

    public id?: number;

    #products: Array<Product>;
    #listeners: Array<Listener>;

    constructor() {
        this.#products = new Array<Product>();
        this.#listeners = new Array<Listener>();
    }

    /**
     * Auto-Buys products upto a given amount.
     * @param amount - is the amount worth of products we need to auto-buy
     */
    public async autobuy(amount: number) {
        
        const products = ProductList.registry;
        
        const cheapestProduct = products.reduce(
            (minProduct, current) => {
                return current.price < minProduct.price ? current : minProduct;
            }
        );
        
        let autoBuyTotal = 0;

        if (amount < cheapestProduct.price) {
            throw new InvalidAutoBuyAmount();
            
        } else {
            const matrixMarkovModel = await parseMatrixCSV("../../matrix.csv");

            assert(products.length >= matrixMarkovModel.length, `There must be at least ${matrixMarkovModel.length} products in the database.`);
        
            if (this.isEmpty()) {
                this.#products.push(cheapestProduct.clone());
                autoBuyTotal += cheapestProduct.price;
            }

            while (amount - autoBuyTotal >= cheapestProduct.price) {

                const lastAddedProduct = this.#products.at(-1)!;

                const match = products.find(p =>
                    p.price === lastAddedProduct.price &&
                    p.constructor === lastAddedProduct.constructor
                );

                assert(match != undefined, "The last product in cart must be from the product list.");

                const transitionRow = matrixMarkovModel.at(products.indexOf(match!))!;
                let randomProductIndex = randomIntInclusive(0, transitionRow[0].denominator - 1);

                assert(products.length >= transitionRow.length, `There must be at least ${matrixMarkovModel.length} products in the database.`);

                let i = 0;
                while (randomProductIndex >= transitionRow[i].numerator) {
                    randomProductIndex -= transitionRow[i].numerator;
                    i++;
                }
                const randomProduct = products.at(i)!;
                let price = randomProduct.price;

                if (randomProduct instanceof ProductWithQuantity) {
                    randomProduct.quantity = Math.min(100, ((amount - autoBuyTotal)*100)/randomProduct.price);
                    price = randomProduct.totalPrice();
                }

                if (amount - autoBuyTotal - price >= 0) {
                    this.#products.push(randomProduct.clone());
                    autoBuyTotal += price;
                
                } else {
                    const cheapestProductsCount = Math.floor((amount - autoBuyTotal) / cheapestProduct.price);
                    
                    for (let i = 0; i < cheapestProductsCount; i++) {
                        this.#products.push(cheapestProduct.clone());
                        autoBuyTotal += cheapestProduct.price;
                    }

                    assert(amount - autoBuyTotal < cheapestProduct.price, "The remaining amount after adding cheapest products should be less than the price of the cheapest product.")

                }
            }
        }

        await Cart.saveCart(this);
        this.#notifyAll();
    };

    /**
     * Creates a new `Receipt` object using the current `Cart`, a provided
     * `Cashier`, and the current timestamp.
     * @param {Cashier} cashier - The cashier who processed the checkout.
     * @returns {Receipt} A new `Receipt` object.
     */

    public checkout(cashier: Cashier): Receipt {
        //no need to check if the products array is null,
        // it is initialized in the constructor and cannot be null
        
        return new Receipt(this, cashier, Temporal.Now.instant());
    }

    /**
     * Adds a product to the cart and notifies all listeners of the change.
     * @param {Product} item - The product to be added to the cart.
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
     * Checks if a product is in the cart.
     * @param item - the product to check for in the cart
     * @returns boolean indicating if the product is in the cart
     */
    public contains(item: Product): boolean {

        //no need to check if the item is null, typescript does not allow it to be null

        return this.#products.includes(item);
    }

    /**
     * Searches for a product in the cart by its ID and returns it if
     * found, otherwise it returns undefined.
     * @param {number} id - The ID of the product to search for in the cart.
     * @returns {Product | undefined} The product with the specified ID if found, otherwise undefined.
     */
    public getProductWithID(id: number): Product | undefined {
        let product = undefined;
        
        for(let p of this.#products) {
            if (p.id == id) {
                product = p;
            }
        }

        return product;
    }

    /**
     * Checks if the cart is empty by verifying if the products array has a length of zero.
     * @returns {boolean} A boolean value indicating whether the cart is empty or not.
     */
    public isEmpty(): boolean {

        //no need to check if the products array is null, 
        // it is initialized in the constructor and cannot be null

        return this.#products.length === 0;
    }

    /**
     * Adds a listener to an array of listeners.
     * @param {Listener} listener - is being added to the list of listeners.
     */
    public registerListener(listener: Listener): void {

        //no need to check if the listener is null, typescript does not allow it to be null

        this.#listeners.push(listener);

        //no post conditions to check, the 'non-null' listener is added to the listeners array
    }

    /**
     * Iterates through all listeners and calls the `notify` method on each
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
     * Defines a custom iterator for a the cart instance
     * I found this to be better than revealing the products array directly.
     * I don't know much typescript so I don't know if this is optimal _:(
     */
    *[Symbol.iterator](): IterableIterator<Product> {
        for (const product of this.#products) {
            yield product;
        }
    }

    /**
     * Saves the given cart to the database. Also saved all products in the cart.
     * @param {Cart} cart - The cart to be saved to the database.
     * @returns {Promise<Cart>} A promise that resolves to the saved cart with assigned IDs.
     * @throws {AssertionError} If there is an error while persisting a product or the cart.
     */
    static async saveCart(cart: Cart): Promise<Cart> {

        if (!cart.id) {
            const results = await db().query<{id: number}>(
                "insert into cart(id) values(default) on conflict do nothing returning id"
            );

            cart.id = results.rows[0].id;
        }

        //we can guarantee that by the time we get here, cart will have an id for sure :)
        for (let product of cart) {
            if (!product.id) {
                await Product.saveProduct(product, cart);
                assert(product.id !== undefined, "Product should have an ID after being saved to the database")
            }
        }

        assert(cart.id !== undefined, "Cart should have an ID after being saved to the database");
        
        return cart;
    }

    /**
     * Populates the given objects with it's associated products in the database.
     * @param cart - is the cart object that needs to be filled from persisted products.
     * @returns {Cart} - is the cart filled with products from the database
     * @throws {AssertionError} - If the provided cart is not already in the database.
     */
    static async populateCart(cart: Cart): Promise<Cart> {

        assert(cart.id !== undefined, "Cart must have an ID to retrieve products.");

        const productsForCart = await Product.getProductsForCart(cart);
        
        for (const product of productsForCart) {
            cart.addItem(product);
        }
        
        return cart;
    }
    
}

export class InvalidCheckoutException extends Error {}
export class InvalidAutoBuyAmount extends Error {}
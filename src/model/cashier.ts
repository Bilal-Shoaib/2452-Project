import { assert } from "../assertions";

import Cart from "./cart";
import db from './connection.ts';
import Product from "./Product/product.ts";
import hashPassword from "../utils/hashing.ts";

export default class Cashier {
    readonly name: string;
    readonly password: string;

    #cart: Cart;

    constructor(name: string, password: string, cart: Cart) {

        if (name.length == 0) {
            throw new InvalidNameException();
        }

        if (password.length == 0) {
            throw new InvalidPasswordException();
        }

        this.name = name;
        this.password = password;
        this.#cart = cart;

        this.#checkCashier();
    }

    /**
     * The function `setCurrentCart` sets the current cart to the provided `Cart` object.
     * @param {Cart} cart - The cart object we want to set as the current cart
     */
    public set cart(cart: Cart) {
        this.#cart = cart;
    }

    public get cart(): Cart {
        return this.#cart;
    }

    /**
     * The function `checkCashier()` method asserts that the cashier's name and password have at
     * least one letter each.
     */
    #checkCashier() {
        assert(this.name.length > 0, "Cashier name must have at least one letter.");
        assert(this.password.length > 0, "Cashier password must have at least one letter.");
    }

    public static async saveCashier(cashier: Cashier): Promise<Cashier> {

        assert(cashier.#cart.id != undefined, "Cashier's current cart must be persisted before the cashier is persisted.");

        //we need to update the cart id on conflicts
        await db().query(
            "insert into cashier(name, password, cart_id) values($1, $2, $3) on conflict (name) do update set cart_id = excluded.cart_id",
            [cashier.name, cashier.password, cashier.#cart.id!]
        )

        return cashier;
    }

    public static async getCashier(name: string, password: string): Promise<Cashier> {
        const results = await db().query<{password: string, cart_id: number}>(
            "select password, cart_id from cashier where name = $1",
            [name]
        )

        // Hash the password using the cashier's name as salt
        const hashedPassword = await hashPassword(password, name);

        const cashier = new Cashier(name, hashedPassword, new Cart());

        //if we can get the cashier, get their cart as well
        if (results.rows.length > 0) {

            if (hashedPassword != results.rows[0].password) {
                throw new PasswordMismatchException();
            }

            cashier.#cart.id = results.rows[0].cart_id;
            cashier.#cart = await Product.getProducts(cashier.#cart);
        
        //otherwise, throw an exception that the cashier is not found
        } else {
            throw new CashierNotFoundException();
        }

        assert(cashier.#cart.id != undefined, "Cashier must have a valid persisted cart after recreation.")

        return cashier
    }
    
    public static async newCashier(name: string, password: string) {
        const results = await db().query<{name: string}>(
            "select name from cashier where name = $1",
            [name]
        )

        // Hash the password using the cashier's name as salt
        const hashedPassword = await hashPassword(password, name);

        const cashier = new Cashier(name, hashedPassword, new Cart())

        if (results.rows.length > 0) {
            throw new CashierFoundException();
        } else {

            await Cart.saveCart(cashier.#cart); //assign an id to the new cart
            await Cashier.saveCashier(cashier); //save the cashier to db
            
        }

        assert(cashier.#cart.id != undefined, "Cashier's cart must be persisted after new cashier creation.");

        return cashier;
    }

}

export class InvalidNameException extends Error {}
export class InvalidPasswordException extends Error {}

export class CashierFoundException extends Error {}
export class CashierNotFoundException extends Error {}
export class PasswordMismatchException extends Error {}
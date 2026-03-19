import { assert } from "../assertions";

import Cart from "./cart";
import db from './connection.ts';

export default class Cashier {
    readonly name: string;
    readonly password: string;

    #currentCart?: Cart;

    constructor(name: string, password: string) {

        if (name.length == 0) {
            throw new InvalidNameException();
        }

        if (password.length == 0) {
            throw new InvalidPasswordException();
        }

        this.name = name;
        this.password = password;

        this.#checkCashier();
    }

    public static async saveCashier(cashier: Cashier): Promise<Cashier> {
        //no need to do anything on conflicts, we will only save a cashier once
        await db().query(
            "insert into cashier(name, password) values($1, $2) on conflict do nothing",
            [cashier.name, cashier.password]
        )

        return cashier;
    }
    public static async updateCashiersCart(cashier: Cashier, cart: Cart): Promise<Cashier> {
        console.log("2. cashier.updateCashiersCart: before await query.")
        console.log([cashier, cart])
        await db().query(
            "update cashier set current_cart_id = $1 where name = $2",
            [cart.id, cashier.name]
        )
        return cashier;
    }

    public static async getCashier(cashier: Cashier): Promise<Cashier> {
        let results = await db().query<{password: string, current_cart_id: number}>(
            "select password from cashier where name = $1",
            [cashier.name]
        )

        //if we can get the cashier, get their cart as well
        if (results.rows.length > 0) {

            if (cashier.password != results.rows[0].password) {
                throw new PasswordMismatchException();
            }

            cashier.#currentCart = await Cart.getCashiersCart(cashier, results.rows[0].current_cart_id);
        
        //otherwise, throw an exception that the cashier is not found
        } else {
            throw new CashierNotFoundException();
        }

        return cashier
    }
    
    public static async newCashier(cashier: Cashier) {
        let results = await db().query<{name: string}>(
            "select name from cashier where name = $1",
            [cashier.name]
        )
        if (results.rows.length > 0) {
            throw new CashierFoundException();
        } else {
            cashier.#currentCart = new Cart(cashier);

            await Cashier.saveCashier(cashier); //save the cashier to db
            await Cart.saveCart(cashier.#currentCart!); //assign an id to the new cart
            await Cashier.updateCashiersCart(cashier, cashier.#currentCart!) //save cashier's cart to db
        }
        return cashier;
    }

    /**
     * The function `setCurrentCart` sets the current cart to the provided `Cart` object.
     * @param {Cart} cart - The cart object we want to set as the current cart
     */
    public set currentCart(cart: Cart) {
        this.#currentCart = cart;
    }

    public get currentCart(): Cart | undefined {
        return this.#currentCart;
    }

    /**
     * The function `checkCashier()` method asserts that the cashier's name and password have at
     * least one letter each.
     */
    #checkCashier() {
        assert(this.name.length > 0, "Cashier name must have at least one letter.");
        assert(this.password.length > 0, "Cashier password must have at least one letter.");
    }
}

export class InvalidNameException extends Error {}
export class InvalidPasswordException extends Error {}
export class CashierFoundException extends Error {}
export class CashierNotFoundException extends Error {}
export class PasswordMismatchException extends Error {}
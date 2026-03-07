import { assert } from "../assertions";
import { Temporal } from "@js-temporal/polyfill";

import Cart, { NoCartForCashierException } from "./cart";
import Receipt from "./receipt";
import db from './connection.ts';

import { InvalidCheckoutException } from "./cart";

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

    static async saveCashier(cashier: Cashier): Promise<Cashier> {
        //no need to do anything on conflicts, we will only save a cashier once
        await db().query(
            "insert into cashier(name, password) values($1, $2) on conflict do nothing",
            [cashier.name, cashier.password]
        )

        return cashier;
    }

    static async getCashier(cashier: Cashier): Promise<Cashier> {
        let results = await db().query<{password: string}>(
            "select password from cashier where name = $1",
            [cashier.name]
        )

        //if we can get the cashier, get their cart as well
        if (results.rows.length > 0) {

            if (cashier.password != results.rows[0].password) {
                throw new PasswordMismatchException();
            }
            //try to get the cashier's cart, if not found, assign them a new cart
            try {
                cashier.#currentCart = await Cart.getCashiersCart(cashier);
                
            //in reality, we are never executing this code chunk, this is just a safety measure
            } catch (e: any) {
                if (e instanceof NoCartForCashierException) {
                    cashier.#currentCart = new Cart(cashier);
                    Cart.saveCart(cashier.#currentCart);
                }
            }
        
        //otherwise, throw an exception that the cashier is not found
        } else {
            throw new CashierNotFoundException();
        }

        return cashier
    }

    /**
     * The function `setCurrentCart` sets the current cart to the provided `Cart` object.
     * @param {Cart} cart - The cart object we want to set as the current cart
     */
    public set currentCart(cart: Cart) {
        this.#currentCart = cart;
    }

    //! this method must always be called when cashier has a current cart
    
    //! otherwise, we can make current cart non-nullable
    //! and check the database for a cart belonging to this cashier
    //! when reconstructing the cashier objects and until then
    //! pass around the cashier name and password, that was entered, as strings
    public get currentCart(): Cart {
        return this.#currentCart!;
    }


    /**
     * The function `generateReceipt` creates a new receipt object based on the current cart and
     * timestamp.
     * @returns A new `Receipt` object for the current cart.
     */
    public generateReceipt(): Receipt {

        //we can enforce that currentCart is not-null because
        //  currentCart itself calls the generateReceipt method
        assert(this.#currentCart, "Cashier's current cart can not be undefined when we generate a receipt.")

        if (this.#currentCart!.isEmpty()) {
            throw new InvalidCheckoutException();
        }
        //create a new receipt object and return it
        return new Receipt(this.#currentCart!, this, Temporal.Now.instant());

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
export class CashierNotFoundException extends Error {}
export class PasswordMismatchException extends Error {}
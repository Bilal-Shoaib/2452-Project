import { assert } from "../assertions";

import Cart from "./cart";

import db from './connection.ts';

import hashPassword from "../utils/hashing.ts";

/**
 * Represents a cashier in a retail system, managing their name, password, and associated currentCart.
 * It provides methods for creating new cashiers, retrieving existing cashiers, and saving cashier information to a database.
 * @property {string} name - The name of the cashier.
 * @property {string} password - The password of the cashier.
 * @property {Cart} currentCart - The current cart of the cashier
 * @throws {InvalidNameException} If the cashier's name is empty.
 * @throws {InvalidPasswordException} If the cashier's password is empty.
 */
export default class Cashier {
    readonly name: string;
    readonly password: string;

    public currentCart: Cart;

    constructor(name: string, password: string, currentCart: Cart) {

        if (name.length == 0) {
            throw new InvalidNameException();
        }

        if (password.length == 0) {
            throw new InvalidPasswordException();
        }

        this.name = name;
        this.password = password;
        this.currentCart = currentCart;

        this.#checkCashier();
    }

    /**
     * Validates the cashier's properties.
     * @throws {AssertionError} If the cashier's name is empty or if the cashier's password is empty.
     */
    #checkCashier() {
        assert(this.name.length > 0, "Cashier name must have at least one letter.");
        assert(this.password.length > 0, "Cashier password must have at least one letter.");
    }

    /**
     * Saves the cashier's information to the database. 
     * If a cashier with the same name already exists, it updates the existing record with the new currentCart ID.
     * @param {Cashier} cashier - The cashier to be saved.
     * @returns {Promise<Cashier>} A promise that resolves to the saved cashier.
     * @throws {AssertionError} If the cashier's current currentCart is not persisted before saving the cashier.
     */
    public static async saveCashier(cashier: Cashier): Promise<Cashier> {

        assert(cashier.currentCart.id != undefined, "Cashier's current currentCart must be persisted before the cashier is persisted.");

        //we need to update the currentCart id on conflicts
        await db().query(
            "insert into cashier(name, password, cart_id) values($1, $2, $3) on conflict (name) do update set cart_id = excluded.cart_id",
            [cashier.name, cashier.password, cashier.currentCart.id!]
        )

        return cashier;
    }

    /**
     * Retrieves a cashier from the database based on the provided name and password.
     * @param {string} name - The name of the cashier to retrieve.
     * @param {string} password - The password of the cashier to retrieve.
     * @returns {Promise<Cashier>} A promise that resolves to the retrieved cashier.
     * @throws {CashierNotFoundException} If no cashier with the provided name is found in the database.
     * @throws {PasswordMismatchException} If the provided password does not match the stored password for the cashier.
     * @throws {AssertionError} If the retrieved cashier's currentCart is not persisted after recreation.
     */
    public static async getCashier(name: string, password: string): Promise<Cashier> {
        const results = await db().query<{password: string, cart_id: number}>(
            "select password, cart_id from cashier where name = $1",
            [name]
        )

        // Hash the password using the cashier's name as salt
        const hashedPassword = await hashPassword(password, name);

        const cashier = new Cashier(name, hashedPassword, new Cart());

        //if we can get the cashier, get their currentCart as well
        if (results.rows.length > 0) {

            if (hashedPassword != results.rows[0].password) {
                throw new PasswordMismatchException();
            }

            cashier.currentCart.id = results.rows[0].cart_id;
            cashier.currentCart = await Cart.populateCart(cashier.currentCart);
        
        //otherwise, throw an exception that the cashier is not found
        } else {
            throw new CashierNotFoundException();
        }

        assert(cashier.currentCart.id != undefined, "Cashier must have a valid persisted currentCart after recreation.")

        return cashier
    }
    
    /**
     * Creates a new cashier with the provided name and password, and saves it to the database.
     * @param {string} name - The name of the new cashier.
     * @param {string} password - The password of the new cashier.
     * @return {Promise<Cashier>} A promise that resolves to the newly created cashier.
     * @throws {CashierFoundException} If a cashier with the provided name already exists in the database.
     * @throws {AssertionError} If the cashier's currentCart is not persisted after creation.
     */
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
            await Cart.saveCart(cashier.currentCart); //assign an id to the new currentCart
            await Cashier.saveCashier(cashier); //save the cashier to db   
        }

        assert(cashier.currentCart.id != undefined, "Cashier's currentCart must be persisted after new cashier creation.");

        return cashier;
    }

}

export class InvalidNameException extends Error {}
export class InvalidPasswordException extends Error {}

export class CashierFoundException extends Error {}
export class CashierNotFoundException extends Error {}
export class PasswordMismatchException extends Error {}
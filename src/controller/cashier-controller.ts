import { assert } from "../assertions";

import type CartController from "./cart-controller";
import Cashier from "../model/cashier";
import CreateCashierView from "../view/create-cashier-view";
import LoginCashierView from "../view/login-cashier-view";

/**
 * The `CashierController` class is responsible for managing the cashier's interactions with the system, including handling login, creating new cashiers, and managing the cashier's cart.
 */
export default class CashierController {
    #cashier?: Cashier;

    #loginCashierView?: LoginCashierView;
    
    constructor(cartController: CartController) {

        //always show the login screen first
        //after a user is logged in, show their cart and allow them to manage it
        this.#loginCashierView = new LoginCashierView(this, cartController);

    }

    /**
     * Creates a new cashier object with the given credentials
     * @param name - is the name of the new cashier
     * @param password - is the password of the new cashier
     * @returns {Cashier} - is the new cashier object
     * @throws {InvalidNameException} - if the entered name is not according to the specified format
     * @throws {InvalidPasswordException} - if the entered password is not according to the specified format
     * @throws {CashierFoundException} - if there is already a cashier with this name in the database
     */
    public async getNewCashier(name: string, password: string): Promise<Cashier> {
        return await Cashier.newCashier(name, password); 
    }

    /**
     * Retrieves the existing cashier object with the given credentials
     * @param name - is the name of the existing cashier
     * @param password - is the password of the existing cashier
     * @returns {Cashier} - is the existing cashier object retrieved from the database
     * @throws {InvalidNameException} - if the entered name is not according to the specified format
     * @throws {InvalidPasswordException} - if the entered password is not according to the specified format
     * @throws {CashierNotFoundException} - if there is no cashier with this name in the database
     * @throws {PasswordMismatchException} - if the entered password for this cashier does not match the password stored in the database
     */
    public async getExistingCashier(name: string, password: string): Promise<Cashier> {
        return await Cashier.getCashier(name, password);
    }

    /**
     * Renders the new cashier creation screen
     * @param cartController - Cart Controller object that is needed by the constructor of CreateCashierView
     */
    public createCashierView(cartController: CartController): void {
        new CreateCashierView(this, cartController);
    }

    /**
     * Sets the current cashier and saves it to the database.
     * @param {Cashier} cashier - Cashier object that represents the cashier being set as current.
     * @throws {AssertionError} if the cashier is already defined when trying to set a new cashier.
     */
    public async setCurrentCashier(cashier: Cashier) {

        assert(this.#cashier == undefined, "The cashier must not be defined when we set a new cashier.")

        this.#cashier = cashier;
        
        await Cashier.saveCashier(this.#cashier);
    }
}
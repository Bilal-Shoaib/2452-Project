import { assert } from "../assertions";
import Cashier from "../model/cashier";
import LoginCashierView from "../view/login-cashier-view";
import type CartController from "./cart-controller";

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
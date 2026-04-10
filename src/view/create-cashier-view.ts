import { CashierFoundException, InvalidNameException, InvalidPasswordException} from "../model/cashier";
import { showError } from "./show-error";

import type CashierController from "../controller/cashier-controller";
import type CartController from "../controller/cart-controller";

/**
 * Renders a dialog that allows users to create a new cashier account.
 */
export default class CreateCashierView {
    #cashierController: CashierController;
    #cartController: CartController;
    #dialog: HTMLDialogElement;

    constructor(cashierController: CashierController, cartController: CartController) {
        this.#cashierController = cashierController;
        this.#cartController = cartController;
        
        this.#dialog = document.createElement("dialog");
        this.#dialog.id = "create-cashier-dialog";
        document.body.appendChild(this.#dialog);

        this.#createCashier();
        this.#dialog.showModal();
    }

    /**
     * Renders the form for creating a new cashier and sets up the event listener for the confirm button.
     */
    #createCashier() {
        this.#dialog.innerHTML = `
        <span id="error" style="color:red;"></span><br/>
        <h3>Add New Cashier</h3>
        <label for="name-input">Name: </label>
        <input type="text" id="name-input"/>
        <label for="password-input">Password: </label>
        <input type="password" id="password-input"/>
        <br/><br/>
        <button id="confirm-btn" type="button">Add Cashier</button>
        `;

        this.#dialog.querySelector("#confirm-btn")!
            .addEventListener(
                "click",
                () => this.#verify()
            );
    }

    /**
     * Verifies the input for creating a new cashier.
     * If there are any errors, it displays appropriate error messages.
     */
    async #verify() {
        const name = (this.#dialog.querySelector("#name-input") as HTMLInputElement).value;
        const password = (this.#dialog.querySelector("#password-input") as HTMLInputElement).value;

        try {
            //we want to see if the cashier exists
            //  if yes, we will show an error
            //  if no, we will add a new cashier

            try {
                const cashier = await this.#cashierController.getNewCashier(name, password);
                //if the cashier does not exist, then we can proceed

                this.#cashierController.setCurrentCashier(cashier);
                this.#cartController.showCart(cashier.currentCart, cashier);
                
                this.#dialog.close();
                this.#dialog.remove();

            } catch (e: any) {
                if (e instanceof CashierFoundException) {
                    showError(this.#dialog, "A cashier with this name already exists. Please choose another name.");    
                }
            }

        } catch (e: any) {
            
                if (e instanceof InvalidNameException) {
                    showError(this.#dialog, "Invalid cashier name, cashier's name must have at least one character (e.g., Adam).");
                } else if (e instanceof InvalidPasswordException) {
                    showError(this.#dialog, "Invalid password, password must have at least one character (e.g., SecurePassword).");
                }
        }
    }
}
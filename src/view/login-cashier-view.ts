import type CartController from "../controller/cart-controller";
import CashierController from "../controller/cashier-controller";
import Cashier, { CashierNotFoundException, InvalidNameException, InvalidPasswordException, PasswordMismatchException } from "../model/cashier";
import CreateCashierView from "./create-cashier-view";

export default class LoginCashierView {
    #cashierController: CashierController;
    #cartController: CartController;
    #dialog: HTMLDialogElement;

    constructor(cashierController: CashierController, cartController: CartController) {
        this.#cashierController = cashierController;
        this.#cartController = cartController;

        this.#dialog = document.createElement("dialog");
        this.#dialog.id = "login-cashier-dialog";
        document.body.appendChild(this.#dialog);

        this.#renderLogin();
        this.#dialog.showModal();
    }

    #renderLogin() {
        this.#dialog.innerHTML = `
            <span id="error" style="color:red;"></span><br/>
            <h3>Cashier Login</h3>
            <label for="name-input">Name: </label>
            <input type="text" id="name-input"/>
            <label for="password-input">Password: </label>
            <input type="password" id="password-input"/>
            <br/><br/>
            <button id="login-btn" type="button">Login</button>
            <button id="create-btn" type="button" style="float:right;">Create New Cashier</button>
        `;

        // Event listeners
        this.#dialog.querySelector("#login-btn")!
            .addEventListener(
                "click",
                () => this.#login()
            );

        this.#dialog.querySelector("#create-btn")!
            .addEventListener(
                "click", 
                () => this.#createNewCashier()
            );
    }

    async #login() {
        const name = (this.#dialog.querySelector("#name-input") as HTMLInputElement).value;
        const password = (this.#dialog.querySelector("#password-input") as HTMLInputElement).value;

        //create a dummy instance of the cashier

        try {
            let cashier = new Cashier(name, password);

            //in case the cashier is created, check for any matches in the db
            cashier = await Cashier.getCashier(cashier)

            //in case the cashier is found in db, we will set the current cashier
            this.#dialog.close();
            this.#dialog.remove();

            this.#cashierController.setCurrentCashier(cashier);
            this.#cartController.showCart(cashier.currentCart);

        } catch (e: any) {
            if (e instanceof InvalidNameException) {
                this.#showError("Invalid user name. Please enter a valid user name (e.g., Adam).");
            } else if (e instanceof InvalidPasswordException) {
                this.#showError("Invalid password. Please enter a valid password (e.g., SecurePassword).");
            } else if (e instanceof CashierNotFoundException) {
                this.#showError("Cashier credentials not found. Please try again or create a new account.");
            } else if (e instanceof PasswordMismatchException) {
                this.#showError("Incorrect Password. Please enter the password associated with this user name.");
            }
        }
    }

    #createNewCashier() {
        this.#dialog.close();
        this.#dialog.remove();

        // Launch CreateCashierView
        new CreateCashierView(this.#cashierController, this.#cartController);
    }

    #showError(message: string) {
        const errorEl = this.#dialog.querySelector("#error")!;
        errorEl.textContent = message;

        // Highlight inputs in red
        this.#dialog.querySelectorAll("input").forEach(input => {
            input.setAttribute("style", "border-color: red");
        });
    }
}
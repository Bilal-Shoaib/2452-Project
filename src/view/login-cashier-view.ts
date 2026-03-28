import type CartController from "../controller/cart-controller";
import CashierController from "../controller/cashier-controller";
import Cashier, { CashierNotFoundException, InvalidNameException, InvalidPasswordException, PasswordMismatchException } from "../model/cashier";
import CreateCashierView from "./create-cashier-view";
import { assert } from "../assertions";

/**
 * The `LoginCashierView` class in TypeScript creates a dialog for cashier login, allowing users to enter their credentials and either log in or create a new cashier account.
 * It interacts with the `CashierController` to set the current cashier and the `CartController` to show the cart for the logged-in cashier.
 */
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

    /**
     * Renders the login form for cashiers, including input fields for name and password, and buttons for logging in and creating a new cashier account.
     * Sets up event listeners for the login and create buttons to handle user interactions.
     */
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

    /**
     * Handles the login process for a cashier. It retrieves the entered name and password, checks the credentials against the database, and if successful, sets the current cashier and shows their cart.
     * If the credentials are invalid or if there are any errors during the login process, it displays appropriate error messages to the user.
     */
    async #login() {
        const name = (this.#dialog.querySelector("#name-input") as HTMLInputElement).value;
        const password = (this.#dialog.querySelector("#password-input") as HTMLInputElement).value;

        //create a dummy instance of the cashier

        try {
            //in case the cashier is created, check for any matches in the db
            const cashier = await Cashier.getCashier(name, password)

            //in case the cashier is found in db, we will set the current cashier
            this.#dialog.close();
            this.#dialog.remove();

            assert(cashier.cart, "Cashier's current cart must not be undefined after successful login.");

            this.#cashierController.setCurrentCashier(cashier);
            this.#cartController.showCart(cashier.cart, cashier);

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

    /**
     * Closes the login dialog and launches the CreateCashierView to allow the user to create a new cashier account.
     */
    #createNewCashier() {
        this.#dialog.close();
        this.#dialog.remove();

        // Launch CreateCashierView
        new CreateCashierView(this.#cashierController, this.#cartController);
    }

    /**
     * Displays an error message in the login dialog and highlights the input fields in red to indicate an error.
     * @param message The error message to display to the user.
     */
    #showError(message: string) {
        const errorEl = this.#dialog.querySelector("#error")!;
        errorEl.textContent = message;

        // Highlight inputs in red
        this.#dialog.querySelectorAll("input").forEach(input => {
            input.setAttribute("style", "border-color: red");
        });
    }
}
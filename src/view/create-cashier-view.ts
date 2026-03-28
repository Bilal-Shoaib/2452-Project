import type CashierController from "../controller/cashier-controller";
import type CartController from "../controller/cart-controller";
import Cashier, { CashierFoundException, InvalidNameException, InvalidPasswordException} from "../model/cashier";

/**
 * The CreateCashierView class is responsible for rendering a dialog that allows users to create a new cashier account.
 * It interacts with the CashierController to set the current cashier and the CartController to show the cart for the new cashier.
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
     * Verifies the input for creating a new cashier. It checks if the cashier already exists and if the input is valid.
     * If the cashier is successfully created, it sets the current cashier and shows the cart for that cashier.
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
                const cashier = await Cashier.newCashier(name, password);
                //if the cashier does not exist, then we can proceed

                this.#cashierController.setCurrentCashier(cashier);
                this.#cartController.showCart(cashier.cart, cashier);
                
                this.#dialog.close();
                this.#dialog.remove();

            } catch (e: any) {
                if (e instanceof CashierFoundException) {
                    this.#showError("A cashier with this name already exists. Please choose another name.");    
                }
            }

        } catch (e: any) {
            
                if (e instanceof InvalidNameException) {
                    this.#showError("Invalid cashier name, cashier's name must have at least one character (e.g., Adam).");
                } else if (e instanceof InvalidPasswordException) {
                    this.#showError("Invalid password, password must have at least one character (e.g., SecurePassword).");
                }
        }
    }

    /**
     * Displays an error message in the dialog and highlights the input fields in red.
     * @param message The error message to display.
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
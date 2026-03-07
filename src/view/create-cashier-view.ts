import type CashierController from "../controller/cashier-controller";
import type CartController from "../controller/cart-controller";
import Cashier, { CashierNotFoundException, InvalidNameException, InvalidPasswordException } from "../model/cashier";
import Cart from "../model/cart";

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

    async #verify() {
        const name = (this.#dialog.querySelector("#name-input") as HTMLInputElement).value;
        const password = (this.#dialog.querySelector("#password-input") as HTMLInputElement).value;

        try {

            let cashier = new Cashier(name, password);

            //we want to see if the cashier exists
            //  if yes, we will show an error
            //  if no, we will add a new cashier

            try {
                cashier = await Cashier.getCashier(cashier);
            } catch (e: any) {
                if (e instanceof CashierNotFoundException) {
                    
                    this.#cashierController.setCurrentCashier(cashier);
                    
                    cashier.currentCart = new Cart(cashier);
                    Cart.saveCart(cashier.currentCart);
                    this.#cartController.showCart(cashier.currentCart);
                    
                    this.#dialog.close();
                    this.#dialog.remove();
                
                } else {
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

    #showError(message: string) {
        const errorEl = this.#dialog.querySelector("#error")!;
        errorEl.textContent = message;

        // Highlight inputs in red
        this.#dialog.querySelectorAll("input").forEach(input => {
            input.setAttribute("style", "border-color: red");
        });
    }
}
import type Cashier from "../model/cashier";

/**
 * The CashierView class is responsible for rendering the cashier interface in the application.
 * It takes a Cashier object as a parameter and displays a welcome message along with instructions for the cashier.
 */
export default class CashierView {
    #cashier: Cashier;
    #dialog: HTMLDivElement;

    constructor(cashier: Cashier) {
        this.#cashier = cashier;
        this.#dialog = document.createElement("div");
        this.#dialog.id = "cashier-screen";
        document.querySelector("#app")!.appendChild(this.#dialog);

        this.#dialog.innerHTML = `
            <h2>Hello, ${this.#cashier.name}!</h2>
            <p>Welcome to the cashier interface. 
            Please use the buttons below to manage your cart and process checkout.</p>
        `;
    }
}
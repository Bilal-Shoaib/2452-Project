import type Cashier from "../model/cashier";

/**
 * Renders a welcome screen for the cashier.
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
            Please use the buttons below to manage your cart and process checkout.
            </br>
            Feel free to try out our latest and greatest Auto-Buy feature :)</p>
        `;
    }
}
import { InvalidAutoBuyAmount } from "../model/cart";
import { showError } from "./show-error";

import type CartController from "../controller/cart-controller";

/**
 * Renders a view for the user to enter an amount for the Auto-Buy feature.
 */
export default class AutoBuyView {
    
    #cartController: CartController;
    #dialog: HTMLDialogElement;
    
    constructor(cartController: CartController) {
        this.#cartController = cartController;

        this.#dialog = document.createElement("dialog");
        this.#dialog.id = "auto-buy-amount-dialog";

        document.body.appendChild(this.#dialog);

        this.#enterAutoBuyAmount()
        this.#dialog.showModal();
    }

    /**
     * Defines the specifics of the dialog box that will be used for taking input of Auto-Buy amount
     */
    #enterAutoBuyAmount(): void {
        this.#dialog.innerHTML = `
        <span id="error" style="color:red;"></span><br/>
        <h3>Enter Auto-Buy Amount</h3>
        <label for="amount-input">Amount (in CAD): </label>
        <input type="number" id="amount-input" min="0"/>
        <br/><br/>
        <button id="confirm-btn" type="button">Confirm Selection</button>

        <!-- Buffering animation -->
        <div id="buffering" style="display:none; margin-top:10px; font-weight:bold; align-items:center; gap:10px;">
            <div style="
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                animation: spin 1s linear infinite;
            "></div>
            Processing...
        </div>

        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
        `;

        this.#dialog.querySelector("#confirm-btn")!
            .addEventListener(
                "click",
                async () => {
                    await this.#verifyAmount();
                }
            );
    }

    /**
     * Verifies that the input amount for Auto-Buy is valid.
     */
    async #verifyAmount() {
        const amountInput = this.#dialog.querySelector("#amount-input") as HTMLInputElement;
        const amount = parseInt(amountInput.value, 10);

        const buffering = this.#dialog.querySelector<HTMLDivElement>("#buffering")!;

        try {
            buffering.style.display = "flex";

            await this.#cartController.autoBuyProducts(amount);

            buffering.style.display = "none";

            this.#dialog.close();
            this.#dialog.remove();

        } catch (e: any) {
            buffering.style.display = "none";
            
            if (e instanceof InvalidAutoBuyAmount) {
                showError(this.#dialog, "Invalid auto-buy amount, the entered amount is less than the cost of the minimum priced product.");
            }
        }
    }

}
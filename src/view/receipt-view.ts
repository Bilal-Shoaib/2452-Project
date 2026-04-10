import { assert } from "../assertions.ts";
import { InvalidCheckoutException } from "../model/cart.ts";
import { showError } from "./show-error.ts";

import Receipt, { CannotApplyCouponException } from "../model/receipt";
import type Product from "../model/Product/product.ts";
import type CartController from "../controller/cart-controller.ts";
import type Cashier from "../model/cashier.ts";
import type Coupon from "../model/Coupon/coupon.ts";


/**
 * Renders a receipt object.
 */
export default class ReceiptView {
    #cartController: CartController;
    #popup: HTMLDialogElement;
    #itemsSummary: HTMLUListElement;
    #receipt?: Receipt;
    #coupons?: Array<Coupon>;
    
    constructor(cartController: CartController, cashier: Cashier) {
        this.#cartController = cartController;
        this.#popup = document.createElement("dialog");

        //precondition: check the existence of the #receipt-container div in the #app div

        //check if the current #app div already has a #receipt-container div, if not create one and append it to the #app div
        let container = document.querySelector("#receipt-container");

        if (!container) {
            container = document.createElement("div");
            container.id = "receipt-container";
            document.querySelector("#app")!.appendChild(container);
        }

        //populate the #receipt-container div with the html for the cart view
            //after the first checkout, the receipt view will be re-rendered with the same html,
            //  so we need to make sure to replace the existing html instead of appending to it
        container.innerHTML = `
            <div id="receipt">
                <button id="checkout"> Proceed to Checkout </button>
            </div>
        `;        

        //add event listener to the "Proceed to Checkout" button that will call the
        //  checkout() method in the cart cartController when clicked
        document.querySelector("#checkout")!
            .addEventListener(
                "click",
                () => { 
                    try {
                        this.#receipt = this.#cartController.checkout(cashier);
                        this.#coupons = this.#cartController.getCouponsForReceipt(this.#receipt);

                        this.#generateReceiptPopUp();
                    } catch (e: any) {
                        if (e instanceof InvalidCheckoutException) {
                            this.#generateErrorPopup();
                        }
                    }
                }
            );


        //create the ul element that will be used to display the summary of items in the receipt
        this.#itemsSummary = document.createElement("ul");
        this.#itemsSummary.id = "receipt-summary";
    }

    /**
     * Creates a popup dialog that displays an error message when the cart is empty during checkout.
     * It includes an "OK" button to close the popup.
     */
    #generateErrorPopup(): void {
        this.#popup.id = "error-popup";

        this.#popup.innerHTML = `
            <p style="color:red;">
                Error: Cart is empty. Please add items to your cart before checking out.
            </p>
            <button id="confirm-btn" type="button">OK</button>
        `;

        this.#popup.querySelector("#confirm-btn")!
            .addEventListener(
                "click",
                () => this.#popup.remove()
            );

        document.body.appendChild(this.#popup);
        this.#popup.showModal();
    }

    /**
     * Creates a popup displaying a receipt.
     */
    #generateReceiptPopUp(): void {

        //no preconditions or postconditions since this method is only 
        // responsible for generating the receipt popup and does not 
        // modify any state or data.

        this.#receipt!.registerListener(this);
        
        this.#popup.id = "receipt-popup";

        // Generate cart items list HTML
        let itemsHTML = this.#getCartItemsHTML();

        this.#popup.innerHTML = `
            <span id="error" style="color:red;"></span><br/>
            <h3>Receipt</h3>
            <ul id="receipt-summary">
                ${itemsHTML}
            </ul>

            <h4>Coupons Available</h4>

            <ul id="coupon-button-list"></ul>

            <h4>Coupons Applied</h4>
            <ul id="applied-coupons-list"></ul>
            
            <p id="receipt-total" style="font-weight:bold;">
                Total: CAD ${this.#receipt!.total}
            </p>
            <button id="complete-btn" type="button">Complete Checkout</button>
        `;

        this.notify();

        this.#popup.querySelector("#complete-btn")!
            .addEventListener("click", async () => {
                this.#popup.remove();

                await this.#cartController.saveReceipt(this.#receipt!);
                this.#cartController.reset(this.#receipt!.cashier);
            });

        document.body.appendChild(this.#popup);
        this.#popup.showModal();
    }

    /**
     * Generates a HTML string for the list of items in the cart.
     * @returns {string} that renders the items in cart
     */
    #getCartItemsHTML(): string {
        
        const summaryMap = this.#getSummaryMap();

        let itemsHTML = "";
        
        summaryMap.forEach((productList, type) => {
            const quantity = productList.length;
            const totalPrice = productList.reduce(
                (sum, product) => sum + product.price,
                0
            );

            itemsHTML += `
                <li>${type} | Quantity: ${quantity} | Price: CAD ${totalPrice}</li>
            `;
        });

        return itemsHTML;
    }

    /**
     * Creates a summary map that groups products in the cart by their type and counts their quantities.
     * @returns {Map} where the key is the product type and the value is an array of products of that type.
     */
    #getSummaryMap(): Map<string, Array<Product>> {
        const summaryMap = new Map<string, Array<Product>>();

        for (const item of this.#receipt!.cart) {
            const type = `${item.constructor.name}`;
            const currentList = summaryMap.get(type);

            if (currentList) {
                currentList.push(item);
            } else {
                summaryMap.set(type, [item]);
            }
        }
        return summaryMap;
    }

    /**
     * Updates the list of available coupons in the receipt popup.
     */
    #updateAvailableCouponButtonsList(): void {

        assert(this.#receipt != undefined, "Receipt view must have a valid receipt instance when creating coupon buttons.");
        assert(this.#coupons != undefined, "Coupons must be defined when linking coupon buttons.");

        const couponButtons = this.#popup.querySelector("#coupon-button-list")! as HTMLUListElement;
        
        couponButtons.replaceChildren();

        couponButtons.style.listStyleType = "none";

        this.#coupons!.forEach((coupon, i) => {
            const li = document.createElement("li");
            li.style.marginBottom = "10px";
            li.innerHTML = `<button id="coupon-${i + 1}-btn">Apply ${coupon.constructor.name} CAD ${coupon.calculateSavings()}</button>`;
            couponButtons.appendChild(li);
        });

        this.#linkAvailableCouponButtons();
    }

    /**
     * Links the buttons for each available coupon to an event listener that applies the selected coupon to the receipt when clicked.
     * If a coupon cannot be applied, it displays an error message to the user.
     */
    #linkAvailableCouponButtons(): void {

        assert(this.#receipt != undefined, "Receipt view must have a valid receipt instance when linking coupon buttons.");
        assert(this.#coupons != undefined, "Coupons must be defined when linking coupon buttons.");

        for (const coupon of this.#coupons!) {
            const couponButton = this.#popup.querySelector(`#coupon-${this.#coupons!.indexOf(coupon)+1}-btn`)! as HTMLButtonElement;

            couponButton.addEventListener(
                "click",
                () => {
                    try {
                        this.#popup.querySelector("#error")!.innerHTML = "";
                        
                        this.#cartController.applyCouponToReceipt(this.#receipt!, coupon);
                        this.#coupons!.splice(this.#coupons!.indexOf(coupon), 1);
                        
                        couponButton.disabled = true;
                        this.notify();
                        
                    } catch (e: any) {
                        if (e instanceof CannotApplyCouponException) {
                            showError(this.#popup, "Cannot apply this coupon now. Please try to add a different coupon or complete checkout.");
                        }
                    }
                }
            );
        }
    }

    /**
     * Updates the list of applied coupons in the receipt popup.
     */
    #updateAppliedCouponsList(): void {
        
        assert(this.#receipt != undefined, "Receipt view must have a valid receipt instance when creating applied coupons list.");
        
        const coupons = this.#receipt!.appliedCoupons;
        const appliedCoupons = this.#popup.querySelector("#applied-coupons-list")! as HTMLUListElement;

        appliedCoupons.replaceChildren();

        appliedCoupons.style.listStyleType = "none";

        for (const coupon of coupons) {
            const li = document.createElement("li");
            li.textContent = `${coupon.constructor.name} reduces total by CAD ${coupon.calculateSavings()}`;
            appliedCoupons.appendChild(li);
        }

    }

    /**
     * Updates the total price displayed in the receipt popup.
     */
    #updateTotal(): void {
        assert(this.#receipt != undefined, "Receipt must exist to update total.");

        const totalElement = this.#popup.querySelector("#receipt-total")!;
        totalElement.textContent = `Total: CAD ${this.#receipt!.total}`;
    }

    /**
     * Updates the rendered version of the receipt.
     */
    public notify(): void {
        this.#updateAvailableCouponButtonsList();
        this.#updateAppliedCouponsList();
        this.#updateTotal();
    }
}
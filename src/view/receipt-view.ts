import Receipt from "../model/receipt";

import { InvalidCheckoutException } from "../model/cart.ts";
import type Product from "../model/Product/product.ts";
import type CartController from "../controller/cart-controller.ts";
import type Cashier from "../model/cashier.ts";
import { assert } from "../assertions.ts";

/**
 * The `ReceiptView` class is responsible for rendering the receipt interface, allowing users to view
 * the summary of items in their receipt and providing a button to proceed to checkout. Since the receipt
 * is generated once right before checkout with no option to modify it, the view does not need to 
 * listen for any changes in the receipt. 
 * I might modify this in the future to allow users to leave the checkout process without completion.
 */
export default class ReceiptView {
    #cartController: CartController;
    #popup: HTMLDialogElement;
    #itemsSummary: HTMLUListElement;
    #receipt?: Receipt;
    
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
                        this.#generateReceiptPopUp(this.#cartController.checkout(cashier));
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
     * The function `generateReceiptPopUp` creates a popup displaying a receipt with item details,
     * total price, and a button to complete checkout.
     */
    #generateReceiptPopUp(receipt: Receipt) {

        //no preconditions or postconditions since this method is only 
        // responsible for generating the receipt popup and does not 
        // modify any state or data.

        receipt.registerListener(this);
        this.#receipt = receipt;
        
        this.#popup.id = "receipt-popup";

        // Generate cart items list HTML
        let itemsHTML = this.#getCartItemsHTML();

        this.#popup.innerHTML = `
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

                await Receipt.saveReceipt(this.#receipt!);
                this.#cartController.reset(this.#receipt!.cashier);
            });

        document.body.appendChild(this.#popup);
        this.#popup.showModal();
    }

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

    #updateCouponButtonsList(): void {

        assert(this.#receipt != undefined, "Receipt view must have a valid receipt instance when creating coupon buttons.");
        
        const coupons = this.#receipt!.availableCoupons;
        const couponButtons = this.#popup.querySelector("#coupon-button-list")! as HTMLUListElement;
        
        couponButtons.replaceChildren();

        couponButtons.style.listStyleType = "none";

        coupons.forEach((coupon, i) => {
            const li = document.createElement("li");
            li.style.marginBottom = "10px";
            li.innerHTML = `<button id="coupon-${i + 1}-btn">Apply ${coupon.constructor.name} CAD ${coupon.amount}</button>`;
            couponButtons.appendChild(li);
        });

        this.#linkButtons();
    }

    #linkButtons(): void {

        assert(this.#receipt != undefined, "Receipt view must have a valid receipt instance when linking coupon buttons.");

        const coupons = this.#receipt!.availableCoupons;
        
        for (const coupon of coupons) {
            const couponButton = this.#popup.querySelector(`#coupon-${coupons.indexOf(coupon)+1}-btn`)! as HTMLButtonElement;

            couponButton.addEventListener(
                "click",
                () => {
                    this.#receipt!.applyCoupon(coupon);
                    couponButton.disabled = true;
                }
            );
        }
    }

    #updateAppliedCouponsList(): void {
        
        assert(this.#receipt != undefined, "Receipt view must have a valid receipt instance when creating applied coupons list.");
        
        const coupons = this.#receipt!.appliedCoupons;
        const appliedCoupons = this.#popup.querySelector("#applied-coupons-list")! as HTMLUListElement;

        appliedCoupons.replaceChildren();

        appliedCoupons.style.listStyleType = "none";

        for (const coupon of coupons) {
            const li = document.createElement("li");
            li.textContent = `${coupon.constructor.name} reduces total by CAD ${coupon.amount}`;
            appliedCoupons.appendChild(li);
        }

    }

    #updateTotal(): void {
        assert(this.#receipt != undefined, "Receipt must exist to update total.");

        const totalElement = this.#popup.querySelector("#receipt-total")!;
        totalElement.textContent = `Total: CAD ${this.#receipt!.total}`;
    }

    public notify(): void {
        this.#updateCouponButtonsList();
        this.#updateAppliedCouponsList();
        this.#updateTotal();
    }
}
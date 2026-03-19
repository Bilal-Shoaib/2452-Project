import Receipt from "../model/receipt";

import { InvalidCheckoutException } from "../model/cart.ts";
import type Product from "../model/Product/product.ts";
import type CartController from "../controller/cart-controller.ts";

/**
 * The `ReceiptView` class is responsible for rendering the receipt interface, allowing users to view
 * the summary of items in their receipt and providing a button to proceed to checkout. Since the receipt
 * is generated once right before checkout with no option to modify it, the view does not need to 
 * listen for any changes in the receipt. 
 * I might modify this in the future to allow users to leave the checkout process without completion.
 */
export default class ReceiptView {
    #cartController: CartController;
    #itemsSummary: HTMLUListElement;
    
    constructor(cartController: CartController) {
        this.#cartController = cartController;

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
                        this.#generateReceiptPopUp(this.#cartController.checkout());
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
        //create popup container
        const popup = document.createElement("dialog");
        popup.id = "error-popup";
        popup.style.border = "1px solid #f00";
        popup.style.padding = "16px";
        popup.style.width = "300px";

        //error message
        const message = document.createElement("p");
        message.textContent = "Error: Cart is empty. Please add items to your cart before checking out.";
        message.style.color = "#f00";
        popup.appendChild(message);

        //confirm button
        const confirmBtn = document.createElement("button");
        confirmBtn.textContent = "OK";
        confirmBtn.addEventListener(
            "click",
            () => popup.remove() //no need to reset the cartController since the cart was already empty
        );
        popup.appendChild(confirmBtn);

        //add popup to DOM
        document.body.appendChild(popup);

        //we use showModal() here to prevent any user interaction with the other buttons on screen
        popup.showModal();
    }

    /**
     * The function `generateReceiptPopUp` creates a popup displaying a receipt with item details,
     * total price, and a button to complete checkout.
     */
    #generateReceiptPopUp(receipt: Receipt): void {

        //no preconditions or postconditions since this method is only 
        // responsible for generating the receipt popup and does not 
        // modify any state or data.
        
        //create popup container
        const popup = document.createElement("dialog");
        popup.id = "receipt-popup";
        
        popup.style.border = "1px solid #000";
        popup.style.padding = "16px";
        popup.style.width = "300px";

        //title
        const title = document.createElement("h3");
        title.textContent = "Receipt";
        popup.appendChild(title);

        //populate #itemsSummary
        const summaryMap = new Map<string, Array<Product>>();

        for (const item of receipt.cart) {
            let type = `${item.constructor.name}`;
            let currentList = summaryMap.get(type);
            if (currentList) {
                currentList.push(item);
            } else {
                summaryMap.set(type, new Array<Product>(item));
            }
        }

        summaryMap.forEach((productList, type) => {
            const quantity = productList.length;
            const totalPrice = productList.reduce((sum, product) => sum + product.price, 0);

            const li = document.createElement("li");
            li.textContent = `${type} | Quantity: ${quantity} | Price: CAD ${totalPrice}`;
            this.#itemsSummary.appendChild(li);
        });

        popup.appendChild(this.#itemsSummary);

        //grand total
        const grandTotal = document.createElement("p");
        grandTotal.textContent = `Total: CAD ${receipt.total}`;
        grandTotal.style.fontWeight = "bold";
        popup.appendChild(grandTotal);

        //complete Checkout button
        const completeBtn = document.createElement("button");
        completeBtn.textContent = "Complete Checkout";
        completeBtn.addEventListener("click", 
            () => {
            //remove popup
            popup.remove();
            //notify cartController to reset cart or perform checkout finalization
            this.#cartController.reset();
        });
        popup.appendChild(completeBtn);

        //add popup to DOM
        document.body.appendChild(popup);

        //we use showModal() here to prevent any user interaction with the other buttons on screen
        popup.showModal();
    }
}
import { showError } from "./show-error.ts";
import ProductWithQuantity, { InvalidProductQuantityException } from "../model/Product/product-with-quantity.ts";

import type CartController from "../controller/cart-controller.ts";
import type Product from "../model/Product/product.ts";


/**
 * Creates a dialog for selecting products to add to cart.
 */
export default class CreateProductView {

    #controller: CartController;
    #dialog: HTMLDialogElement;

    constructor(controller: CartController, productList: Array<Product>) {
        this.#controller = controller;

        //create dialog element to hold the product creation form
        this.#dialog = document.createElement("dialog");
        this.#dialog.id = "add-product-dialog";

        //add the dialog to the DOM
        document.body.appendChild(this.#dialog);

        //select product type first, then proceed to price input and submission
        this.#selectProductType(productList);
        
        //we use showModal() here to prevent any user interaction with the other buttons on screen
        this.#dialog.showModal();
    }

    /**
     * Displays a dialog for selecting products, 
     *      then based on the user's selection, adds that product to cart.
     */
    #selectProductType(productList: Array<Product>): void {

        //no preconditions or postconditions for this function, 
        // as it simply sets up the initial product type selection dialog
        
        //works with OCP :)
        //  not sure if this is good practice though
        this.#dialog.innerHTML = `
            <h3>Select Product Type</h3>
            ${this.#getProductButtons(productList)}
        `;

        this.#linkButtons(productList);
    }

    /**
     * Creates an HTML string for buttons of all available products.
     * @param productList the list of products available to be purchased.
     * @returns the html code to render buttons for all products.
     */
    #getProductButtons(productList: Array<Product>): string {
        let buttonsHTML = "";
        for(const product of productList) {
            let buttonHTML = `<button id="product-${productList.indexOf(product)+1}-btn">`;
            buttonHTML += `${product.constructor.name} CAD ${product.price}`;
            
            if (product instanceof ProductWithQuantity) {
                buttonHTML += ` per ${ProductWithQuantity.MG_PER_UNIT} mg`;
            }
            
            buttonHTML += `</button><br/><br/>`;
            buttonsHTML += buttonHTML;
        }
        return buttonsHTML;
    }

    /**
     * Links the buttons for each product to an event listener that adds the selected product to the cart.
     * If the product is a product with quantity, it prompts the user to enter additional details before adding it to the cart.
     * @param productList the list of products available to be purchased.
     */
    #linkButtons(productList: Array<Product>) {
        for (let product of productList) {
            this.#dialog.querySelector(`#product-${productList.indexOf(product)+1}-btn`)!
            .addEventListener(
                "click",
                async () => {

                    if (product instanceof ProductWithQuantity) {
                        product = await this.#enterQuantity(product as ProductWithQuantity);
                    }

                    this.#controller.addProductToCart(product.clone());
                    
                    this.#dialog.close();
                    this.#dialog.remove();
                }
            );
        }
    }

    /**
     * Displays a dialog for entering additional details for a product with quantity, such as quantity.
     * Validates the input and updates the product with quantity accordingly.
     * @param product the product with quantity for which details are being entered.
     * @returns a promise that resolves to the updated product with quantity with the entered details.
     */
    async #enterQuantity(product: ProductWithQuantity): Promise<Product> {
        this.#dialog.innerHTML = `
            <span id="error" style="color:red;"></span><br/>
            <h3>Enter Smoothie Quantity</h3>
            <label for="quantity-input">Quantity (in mg): </label>
            <input type="number" id="quantity-input" min="0"/>
            <br/><br/>
            <button id="confirm-btn" type="button">Confirm Selection</button>
        `;

        return new Promise<Product>((resolve) => {
            this.#dialog.querySelector("#confirm-btn")!
                .addEventListener(
                    "click",
                    () => {
                        this.#verifyQuantity(product);

                        if (product.quantity != undefined) {
                            resolve(product);
                        }
                    }
                );
        })
    }

    /**
     * Validates the quantity input for a product with quantity and updates the product's quantity if valid.
     * If the input is invalid, it displays an error message.
     * @param product the product with quantity for which the quantity is being verified.
     */
    #verifyQuantity(product: ProductWithQuantity) {
        const quantityInput = this.#dialog.querySelector("#quantity-input") as HTMLInputElement;
        const quantity = parseInt(quantityInput.value, 10);

        try {
            product.quantity = quantity;
    
        } catch (e: any) {
            if (e instanceof InvalidProductQuantityException) {
                showError(this.#dialog, "Invalid product quantity, please enter a non-negative integer.");
            }
        }
    }
}
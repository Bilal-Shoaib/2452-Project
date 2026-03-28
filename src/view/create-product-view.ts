import CartController from "../controller/cart-controller.ts";
import Product from "../model/Product/product.ts";
import Smoothie, { InvalidSmoothieQuantityException } from "../model/Product/smoothie.ts";

/**
 * The `CreateProductView` class in TypeScript creates a dialog for selecting and adding fruit or
 * vegetable products to a cart with price validation.
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
     * The function `selectProductType` displays a dialog for selecting between fruit and vegetable
     * products, then based on the user's selection, adds a product to cart.
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
            buttonsHTML += `<button id="product-${productList.indexOf(product)+1}-btn">${product.constructor.name} CAD ${product.price}</button><br/><br/>`;
        }
        return buttonsHTML;
    }

    /**
     * Links the buttons for each product to an event listener that adds the selected product to the cart.
     * If the product is a smoothie, it prompts the user to enter additional details before adding it to the cart.
     * @param productList the list of products available to be purchased.
     */
    #linkButtons(productList: Array<Product>) {
        for (let product of productList) {
            this.#dialog.querySelector(`#product-${productList.indexOf(product)+1}-btn`)!
            .addEventListener(
                "click",
                async () => {

                    if (product instanceof Smoothie) {
                        product = await this.#enterSmoothieDetails(product);
                    }

                    this.#controller.addProductToCart(product.clone());
                    
                    this.#dialog.close();
                    this.#dialog.remove();
                }
            );
        }
    }

    /**
     * Displays a dialog for entering additional details for a smoothie product, such as quantity.
     * Validates the input and updates the smoothie product accordingly.
     * @param smoothie the smoothie product for which details are being entered.
     * @returns a promise that resolves to the updated smoothie product with the entered details.
     */
    async #enterSmoothieDetails(smoothie: Smoothie): Promise<Product> {
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
                        this.#verifyQuantity(smoothie);

                        if (smoothie.quantity != undefined) {
                            resolve(smoothie);
                        }
                    }
                );
        })
    }

    /**
     * Validates the quantity input for a smoothie product and updates the product's quantity if valid.
     * If the input is invalid, it displays an error message.
     * @param smoothie the smoothie product for which the quantity is being verified.
     */
    #verifyQuantity(smoothie: Smoothie) {
        const quantityInput = this.#dialog.querySelector("#quantity-input") as HTMLInputElement;
        const quantity = parseInt(quantityInput.value, 10);

        try {
            smoothie.quantity = quantity;
    
        } catch (e: any) {
            if (e instanceof InvalidSmoothieQuantityException) {
                this.#showError("Invalid smoothie quantity, please enter a non-negative integer.");
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

        // Highlight the input in red
        this.#dialog.querySelectorAll("input").forEach(input => {
            input.setAttribute("style", "border-color: red");
        });
    }

}
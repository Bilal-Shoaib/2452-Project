import CartController from "../controller/cart-controller.ts";
import Product from "../model/Product/product.ts";

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

    #getProductButtons(productList: Array<Product>): string {
        let buttonsHTML = "";
        for(let product of productList) {
            buttonsHTML += `<button id="product-${productList.indexOf(product)+1}-btn">${product.constructor.name} CAD ${product.price}</button><br/><br/>`;
        }
        return buttonsHTML;
    }

    #linkButtons(productList: Array<Product>) {
        for (let product of productList) {
            this.#dialog.querySelector(`#product-${productList.indexOf(product)+1}-btn`)!
            .addEventListener(
                "click",
                () => {
                    this.#controller.addProductToCart(product.clone());

                    //after adding the product to cart, close this popup
                    this.#dialog.close();
                    this.#dialog.remove();
                }
            );
        }
    }
}
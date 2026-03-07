import CartController from "../controller/cart-controller.ts";

/**
 * The `CreateProductView` class in TypeScript creates a dialog for selecting and adding fruit or
 * vegetable products to a cart with price validation.
 */
export default class CreateProductView {

    #controller: CartController;
    #dialog: HTMLDialogElement;

    constructor(controller: CartController, productPriceRegistry: Map<string, number>, productTypes: Array<string>) {
        this.#controller = controller;

        //create dialog element to hold the product creation form
        this.#dialog = document.createElement("dialog");
        this.#dialog.id = "add-product-dialog";

        //add the dialog to the DOM
        document.body.appendChild(this.#dialog);

        //select product type first, then proceed to price input and submission
        this.#selectProductType(productPriceRegistry, productTypes);
        
        //we use showModal() here to prevent any user interaction with the other buttons on screen
        this.#dialog.showModal();
    }

    /**
     * The function `selectProductType` displays a dialog for selecting between fruit and vegetable
     * products, then based on the user's selection, adds a product to cart.
     */
    #selectProductType(productPriceRegistry: Map<string, number>, productTypes: Array<string>): void {

        //no preconditions or postconditions for this function, 
        // as it simply sets up the initial product type selection dialog
        
        //works with OCP :)
        //  not sure if this is good practice though
        this.#dialog.innerHTML = `
            <h3>Select Product Type</h3>
            ${this.#getProductButtons(productPriceRegistry)}
        `;

        this.#linkButtons(productTypes);
    }

    //! is this okay? safe? relies heavily on the factory
    //! problem: without these methods, we would have to manually repeat 
    //! these code chunks which does not comply with ocp

    #getProductButtons(registry: Map<string, number>): string {
        let buttonsHTML = "";
        for (let type of registry.keys()) {
            buttonsHTML += `<button id="${type}-btn">${type} CAD ${registry.get(type)}</button><br/><br/>`;
        }
        return buttonsHTML;
    }

    #linkButtons(product_types: Array<string>) {
        for (let type of product_types) {
            this.#dialog.querySelector(`#${type}-btn`)!
            .addEventListener(
                "click",
                () => {
                    this.#controller.addProductToCart(type);

                    //after adding the product to cart, close this popup
                    this.#dialog.close();
                    this.#dialog.remove();
                }
            );
        }
    }
}
import CartController from "../controller/cart-controller.ts";

/**
 * The `CreateProductView` class in TypeScript creates a dialog for selecting and adding fruit or
 * vegetable products to a cart with price validation.
 */
export default class CreateProductView {

    #controller: CartController;
    #dialog: HTMLDialogElement;

    constructor(controller: CartController) {
        this.#controller = controller;

        //create dialog element to hold the product creation form
        this.#dialog = document.createElement("dialog");
        this.#dialog.id = "add-product-dialog";

        //add the dialog to the DOM
        document.body.appendChild(this.#dialog);

        //select product type first, then proceed to price input and submission
        this.#selectProductType();
        
        //we use showModal() here to prevent any user interaction with the other buttons on screen
        this.#dialog.showModal();
    }

    /**
     * The function `selectProductType` displays a dialog for selecting between fruit and vegetable
     * products, then based on the user's selection, adds a product to cart.
     */
    #selectProductType(): void {

        //no preconditions or postconditions for this function, 
        // as it simply sets up the initial product type selection dialog

        this.#dialog.innerHTML = `
            <h3>Select Product Type</h3>
            <button id="fruit-btn">Fruit CAD ${CartController.fruitPrice}</button>
            <button id="vegetable-btn">Vegetable CAD ${CartController.vegetablePrice}</button>
        `;

        //if the fruit button is clicked, add a fruit to cart
        this.#dialog.querySelector("#fruit-btn")!
            .addEventListener(
                "click",
                () => {
                    this.#controller.addFruitToCart();

                    //after adding the product to cart, close this popup
                    this.#dialog.close();
                    this.#dialog.remove();
                }
            );

        //if the vegetable button is clicked, add a vegetable to cart
        this.#dialog.querySelector("#vegetable-btn")!
            .addEventListener(
                "click",
                () => {
                    this.#controller.addVegetableToCart();

                    //after adding the product to cart, close this popup
                    this.#dialog.close();
                    this.#dialog.remove();
                }
            );
    
    }
}
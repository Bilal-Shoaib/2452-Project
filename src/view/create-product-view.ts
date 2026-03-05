import type CartController from "../controller/cart-controller.ts";
import Fruit from "../model/Product/fruit.ts";
import Vegetable from "../model/Product/vegetable.ts";
import Product from "../model/Product/product.ts";

import { InvalidPriceException } from "../model/Product/product.ts";
import { assert } from "../assertions.ts";

/**
 * The `CreateProductView` class in TypeScript creates a dialog for selecting and adding fruit or
 * vegetable products to a cart with price validation.
 */
export default class CreateProductView {

    #controller: CartController;
    #dialog: HTMLDialogElement;

    // stores the constructor for the selected product type
    #productConstructor: ((price: number) => Product) | null = null;

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
     * products, setting the product constructor accordingly based on the user's selection.
     */
    #selectProductType(): void {

        //no preconditions or postconditions for this function, 
        // as it simply sets up the initial product type selection dialog

        this.#dialog.innerHTML = `
            <h3>Select Product Type</h3>
            <button id="fruit-btn">Fruit</button>
            <button id="vegetable-btn">Vegetable</button>
        `;

        //if the fruit button is clicked, set the product constructor to create a Fruit and proceed to price input
        this.#dialog.querySelector("#fruit-btn")!
            .addEventListener(
                "click",
                () => {
                    this.#productConstructor = (price: number) => new Fruit(price);
                    this.#getProductPrice();
                }
            );

        //if the vegetable button is clicked, set the product constructor to create a Vegetable and proceed to get the price
        this.#dialog.querySelector("#vegetable-btn")!
            .addEventListener(
                "click",
                () => {
                    this.#productConstructor = (price: number) => new Vegetable(price);
                    this.#getProductPrice();
                }
            );
    
    }

    /**
     * The function #getProductPrice() sets up a dialog box for entering a product price and submitting
     * it.
     */
    #getProductPrice(): void {

        //no preconditions or postconditions for this function,
        // as it simply sets up the price input and submission dialog

        this.#dialog.innerHTML = `
            <span id="error" style="color:red;"></span><br/>
            <label>Enter product price</label>
            <input type="number" id="price-input"/>
            <button id="confirm-btn">Add Product</button>
        `;

        this.#dialog.querySelector("#confirm-btn")!
            .addEventListener(
                "click", 
                () => this.#submit()
            );
    }

    /**
     * The function submits a product with a price input to a cart, handling exceptions for invalid prices.
     */
    #submit(): void {

        //precondition: the product constructor must be set (i.e., a product type must have been selected)
        //precondition: the price input must be present in the dialog

        const input = this.#dialog.querySelector("#price-input") as HTMLInputElement;
        const price = input.valueAsNumber;

        try {
            
            //by the time we reach this point, the product constructor must be set already by the
            // selectProductType function, so we can safely assert that it is not null
            
            //precondition satisfied: this.#productConstructor is not null :)
            const product = this.#productConstructor!(price);

            //postcondition: a valid product is created and added to cart
            assert(product instanceof Product, "Created product should be an instance of Product");
            assert(product.price >= 0, "Product price should be non-negative");

            this.#controller.addProductToCart(product);

            this.#dialog.close();
            this.#dialog.remove();

        } catch (e: any) {
            if (e instanceof InvalidPriceException) {
                this.#dialog.querySelector("input")!
                    .setAttribute("style", "border-color: red");
                this.#dialog.querySelector("#error")!
                    .textContent = "Invalid product price, price must be non-negative (e.g., 10).";
            }
        }
    }

}
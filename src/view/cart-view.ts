import Cart from "../model/cart";

import type CartController from "../controller/cart-controller.ts";

/**
 * The `CartView` class is responsible for rendering the shopping cart interface, allowing users to view
 * the products in their cart and providing a button to add more products. It listens for changes in the
 * cart and updates the display accordingly.
 */
export default class CartView {
   #cart: Cart;
   #itemsEL: HTMLUListElement;
   #cartController: CartController;

    constructor(cart: Cart, cartController: CartController) {
        this.#cart = cart;
        this.#cartController = cartController;
        
        //register this view as a listener to the cart so that it can be notified of changes to the cart's state
        this.#cart.registerListener(this);

        //precondition: check the existence of #cart-container div in the #app div

        //check if the current #app div already has a #cart-container div, if not create one and append it to the #app div
        let container = document.querySelector("#cart-container");
        
        if (!container) {
            container = document.createElement("div");
            container.id = "cart-container";
            document.querySelector("#app")!.appendChild(container);
        }

        //populate the #cart-container div with the html for the cart view
            //after the first checkout, the cart view will be re-rendered with the same html,
            //  so we need to make sure to replace the existing html instead of appending to it
        container.innerHTML = `
            <div id= 'cart'>
                <button id= "add-product"> Add Product to Cart </button>
                <ul></ul>
            </div>
        `;
        
        //store the reference to the ul element where the products in the cart will be displayed
        this.#itemsEL = document.querySelector("#cart > ul")!;

        //add event listener to the "Add Product to Cart" button that will call the
        //  showCreateProductView() method in the cart controller when clicked
        document.querySelector("#add-product")!
            .addEventListener(
                "click",
                () => this.#cartController.showCreateProductView()
            );
        this.notify();
    }

    /**
     * The `notify` function updates the internal state of the list of products in the cart by removing
     * all items and then adding them back with their names and prices displayed in a list format.
     */
    public notify(): void {
        
        //no preconditions or postconditions to check for this method,
        // because we live in a 'non-null' land :)
        
        //remove all items from cart
        this.#itemsEL.replaceChildren();

        //add all items again
        for (const product of this.#cart) {
            const li = document.createElement("li");
            let detail = ``;

            if ("quantity" in product) {
                detail += `(${product.quantity} mg)`;
            }
            
            li.innerHTML = `<strong>${product.constructor.name} ${detail}: CAD ${product.price}</strong>`;
            this.#itemsEL.appendChild(li);
        }
    }
    
}
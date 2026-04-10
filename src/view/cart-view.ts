import type CartController from "../controller/cart-controller.ts";
import Cart from "../model/cart";
import ProductWithQuantity from "../model/Product/product-with-quantity.ts";

/**
 * Renders the current cart.
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
                <button id= "auto-buy"> Auto-Buy Products </button>
                <button id= "add-product"> Add Product to Cart </button>
                <ul></ul>
            </div>
        `;
        
        this.#itemsEL = document.querySelector("#cart > ul")!;

        document.querySelector("#add-product")!
            .addEventListener(
                "click",
                () => this.#cartController.showCreateProductView()
            );

        document.querySelector("#auto-buy")!
            .addEventListener(
                "click",
                () => this.#cartController.showAutoBuyView()
            );
            
        this.notify();
    }

    /**
     * Updates the internal state of the list of products in the cart.
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
            let price = product.price;

            if (product instanceof ProductWithQuantity) {
                detail += `(${product.quantity} mg)`;
                price = product.totalPrice();
            }
            
            li.innerHTML = `<strong>${product.constructor.name} ${detail}: CAD ${price}</strong>`;
            this.#itemsEL.appendChild(li);
        }
    }
    
}
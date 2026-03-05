import Cart, { InvalidCheckoutException } from '../model/cart.ts';
import Product from '../model/Product/product.ts';
import Receipt from '../model/receipt.ts';

import CartView from '../view/cart-view.ts';
import CreateProductView from '../view/create-product-view.ts';
import ReceiptView from '../view/receipt-view.ts';

/**
 * The `CartController` class manages a shopping cart, allows adding products, displaying a receipt,
 * creating new products, and resetting the cart state.
 */
export default class CartController {
    #cart: Cart;
    #cartView: CartView;
    #receiptView: ReceiptView;
    #createProductView?: CreateProductView;

    constructor() {
        this.#cart = new Cart();
        this.#cartView = new CartView(this.#cart, this);
        this.#receiptView = new ReceiptView(this);
    }

    /**
     * The function `addProductToCart` adds a product to the cart.
     * @param {Product} product - Product object that represents the product being added to the cart.
     */
    public addProductToCart(product: Product): void {

        //no need to check if the product is null, typescript will not allow it to be null
        //no other preconditions to check, the product is valid and can be added to the cart

        this.#cart.addItem(product);

        //no postconditions to check, the 'non-null' product will be added to the cart
    }

    /**
     * The function `showCreateProductView` generates a view to create/specify a new product
     */
    public showCreateProductView(): void {

        //this method does not have any preconditions to check, it simply generates a view to create a new product

        this.#createProductView = new CreateProductView(this);

        //no postconditions to check as well
    }

    /**
     * The `checkout` function generates a receipt pop-up if the cart is not empty.
     * @throws {InvalidCheckoutException} if checkout operation is perfomed on an empty cart.
     */
    public checkout(): Receipt {

        //precondition: the cart should not be empty, otherwise there is nothing to checkout
        // we throw an exception in that case to let the view know. The exception is thrown from cart.
        //no postconditions to check, if the cart is empty, the method simply alerts the receipt view

        return this.#cart.checkout();
    }

    /**
     * The `reset` function resets the `Cart`, `CartView`, and `ReceiptView` properties to their initial states.
     */
    public reset(): void {

        //there are no preconditions to check for this method, it simply resets the properties
        //perhaps we could use DIP and inject these new instances but this was 
        //said to be just fine in class :)

        this.#cart = new Cart();
        this.#cartView = new CartView(this.#cart, this);
        this.#receiptView = new ReceiptView(this);
    }
}
import { assert } from '../assertions.ts';

import Cart from '../model/cart.ts';
import Cashier from '../model/cashier.ts';
import Product from '../model/Product/product.ts';

import Receipt from '../model/receipt.ts';

import CartView from '../view/cart-view.ts';
import CreateProductView from '../view/create-product-view.ts';
import ReceiptView from '../view/receipt-view.ts';
import type CashierController from './cashier-controller.ts';

/**
 * The `CartController` class manages a shopping cart, allows adding products, displaying a receipt,
 * creating new products, and resetting the cart state.
 */
export default class CartController {

    #productList: Array<Product>;

    #cart?: Cart;
    #cartView?: CartView;
    #receiptView?: ReceiptView;
    #createProductView?: CreateProductView;


    constructor(productList: Array<Product>) {
        this.#productList = productList;
    }

    public addProductToCart(product: Product): void {
        //at this point, we can assert that the cart is not empty
        //  this is because the only point where this method is called is after cart-view is initialized
        //  which means we have also set this.#cart :)
        assert(this.#cart != undefined, "Cart can not be undefined when we try to add a product.");
        
        this.#cart!.addItem(product);
        //no post-conditions needed if the precondition is satisfied

    }

    public showCart(cart: Cart): void {
        this.#cart = cart;
        this.#cartView = new CartView(cart, this);
        this.#receiptView = new ReceiptView(this);
    }

    /**
     * The function `showCreateProductView` generates a view to create/specify a new product
     */
    public showCreateProductView(): void {

        //this method does not have any preconditions to check, it simply generates a view to create a new product

        this.#createProductView = new CreateProductView(this, this.#productList);

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

        //at this point, we can assert that the cart is not empty
        //  this is because the only point where this method is called is after receipt-view is initialized
        //  which means we have also set this.#cart :)
        assert(this.#cart != undefined, "Cart cannot be undefined when we checkout.")

        return this.#cart!.checkout();
    }

    /**
     * The `reset` function resets the `Cart`, `CartView`, and `ReceiptView` properties to their initial states.
     */
    public async reset() {

        //there are no preconditions to check for this method, it simply resets the properties
        //perhaps we could use DIP and inject these new instances but this was 
        //said to be just fine in class :)

        //we can assert that cart is not undefined at this point because this method 
        // is called by the receipt-view after a successful checkout which means 
        // that this.#cart is already set :)

        assert(this.#cart != undefined, "Cart cannot be undefined when we reset the cart-controller.")

        this.#cart = new Cart(this.#cart!.cashier);
        await Cart.saveCart(this.#cart);
        this.#cart.cashier.currentCart = this.#cart;

        console.log("1. cart-controller.reset: before updateCashiersCart().")
        console.log([this.#cart.cashier, this.#cart])
        
        await Cashier.updateCashiersCart(this.#cart.cashier, this.#cart);

        this.#cartView = new CartView(this.#cart, this);
        this.#receiptView = new ReceiptView(this);
    }
}

export class CartNotDefinedException extends Error {}
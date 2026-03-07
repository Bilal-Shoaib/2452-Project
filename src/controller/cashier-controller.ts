import { assert } from "../assertions";
import Cashier from "../model/cashier";
import Cart from "../model/cart";
import Product from "../model/Product/product";
import Receipt from "../model/receipt";
import CreateCashierView from "../view/create-cashier-view";
import LoginCashierView from "../view/login-cashier-view";
import type CartController from "./cart-controller";


export default class CashierController {
    #cashier?: Cashier;
    
    #createCashierView?: CreateCashierView;
    #loginCashierView?: LoginCashierView;

    #cartController: CartController;
    
    constructor(cartController: CartController) {

        this.#cartController = cartController;

        //always show the login screen first
        //after a user is logged in, show their cart and allow them to manage it
        this.#loginCashierView = new LoginCashierView(this, cartController);

    }

    //called by both login-view and create-view
    public async setCurrentCashier(cashier: Cashier) {

        assert(!this.#cashier, "The cashier must not be defined when we set a new cashier.")

        //! is this okay? looks like we don't do enough validation here
        //! maybe we should check that cashier has a cart?
        //! maybe check that the cashier is in the db?
        this.#cashier = cashier;
        
        await Cashier.saveCashier(this.#cashier);
        //after the cashier is set we want to set both views to null
        //  both - because we don't know which view called this method
        //this.#createCashierView = undefined;
        //this.#loginCashierView = undefined;
    }
 
    
    
    /**
     * The function `addProductToCart` adds a product to the cart.
     * @param {Product} product - Product object that represents the product being added to the cart.
     */
    public addProductToCart(product: Product): void {

        //no need to check if the product is null, typescript will not allow it to be null
        //no other preconditions to check, the product is valid and can be added to the cart

        assert(this.#cashier, "The cashier can not be undefined when we add product to cart.")

        this.#cashier!.currentCart.addItem(product);

        //no postconditions to check, the 'non-null' product will be added to the cart
    }

    /**
     * The `checkout` function generates a receipt pop-up if the cart is not empty.
     * @throws {InvalidCheckoutException} if checkout operation is perfomed on an empty cart.
     */
    public checkout(): Receipt {

        //precondition: the cart should not be empty, otherwise there is nothing to checkout
        // we throw an exception in that case to let the view know. The exception is thrown from cart.
        //no postconditions to check, if the cart is empty, the method simply alerts the receipt view

        assert(this.#cashier, "The cashier can not be undefined when we checkout.")

        return this.#cashier!.currentCart.checkout();
    }

}
import { assert } from '../assertions.ts';

import type Coupon from '../model/Coupon/coupon.ts';
import type Product from '../model/Product/product.ts';
import Cart from '../model/cart.ts';
import Cashier from '../model/cashier.ts';
import BOGO from '../model/Coupon/bogo.ts';
import Discount from '../model/Coupon/discount.ts';
import Receipt from '../model/receipt.ts';
import CartView from '../view/cart-view.ts';
import CashierView from '../view/cashier-view.ts';
import CreateProductView from '../view/create-product-view.ts';
import ReceiptView from '../view/receipt-view.ts';
import AutoBuyView from '../view/auto-buy-view.ts';

/**
 * The `CartController` class manages a shopping cart, allows adding products, displaying a receipt,
 * creating new products, and resetting the cart state.
 */
export default class CartController {

    #productList: Array<Product>;

    #cart?: Cart;
    #cashierView?: CashierView;
    #cartView?: CartView;
    #receiptView?: ReceiptView;
    #createProductView?: CreateProductView;
    #showAutoBuyView?: AutoBuyView;


    constructor(productList: Array<Product>) {
        this.#productList = productList;
    }

    /**
     * Persists the given receipt to the database
     * @param receipt - is the receipt object that needs to be persisted
     * @returns - the persisted receipt object
     */
    public async saveReceipt(receipt: Receipt): Promise<Receipt> {
        await Receipt.saveReceipt(receipt);
        return receipt;
    }

    /**
     * Applies a coupon to the given receipt
     * @param receipt - is the receipt object to which the coupon will be applied
     * @param coupon - is the coupon that needs to be applied to the receipt object
     */
    public applyCouponToReceipt(receipt: Receipt, coupon: Coupon): void {
        receipt.applyCoupon(coupon);
    }

    /**
     * Creates a view to get input for the autobuy amount
     */
    public showAutoBuyView(): void {    
        this.#showAutoBuyView = new AutoBuyView(this);
    }

    /**
     * Autobuys products worth the entered amount
     * @param amount - is the amount worth of products the system needs to autobuy
     * @throws {InvalidAutoBuyAmount} - if the entered amount is negative
     */
    public async autoBuyProducts(amount: number) {
        assert(this.#cart != undefined, "Cart can not be undefined when we try to auto-buy products.")

        await this.#cart!.autobuy(amount);
    }

    /**
     * Adds a product to the cart.
     * @param {Product} product - The product to be added to the cart.
     * @throws {AssertionError} if the cart is undefined when trying to add a product.
     */
    public addProductToCart(product: Product): void {
        //at this point, we can assert that the cart is not empty
        //  this is because the only point where this method is called is after cart-view is initialized
        //  which means we have also set this.#cart :)
        assert(this.#cart != undefined, "Cart can not be undefined when we try to add a product.");

        this.#cart!.addItem(product);
        //no post-conditions needed if the precondition is satisfied

    }

    /**
     * Initializes the `CartView` and `ReceiptView` with the provided `Cart` and `Cashier`.
     * @param {Cart} cart - The shopping cart to be displayed.
     * @param {Cashier} cashier - The cashier associated with the cart.
     */
    public showCart(cart: Cart, cashier: Cashier): void {
        this.#cart = cart;
        this.#cashierView = new CashierView(cashier);
        this.#cartView = new CartView(cart, this);
        this.#receiptView = new ReceiptView(this, cashier);
    }

    /**
     * Generates a view to create/specify a new product
     */
    public showCreateProductView(): void {

        //this method does not have any preconditions to check, it simply generates a view to create a new product

        this.#createProductView = new CreateProductView(this, this.#productList);

        //no postconditions to check as well
    }

    /**
     * Retrieves all available coupons for a given receipt.
     * @param {Receipt} receipt - The receipt for which to retrieve coupons.
     * @return {Array<Coupon>} The list of available coupons.
     */

    public getCouponsForReceipt(receipt: Receipt): Array<Coupon> {
        const coupons = new Array<Coupon>();

        coupons.push(...BOGO.getAvailableBOGOs(receipt));
        coupons.push(...Discount.getAvailableDiscounts(receipt));
        
        return coupons;
    }

    /**
     * Processes the checkout of the cart using the provided cashier and returns a receipt.
     * @param {Cashier} cashier - The cashier handling the checkout process.
     * @return {Receipt} The receipt generated from the checkout process.
     * @throws {AssertionError} if the cart is undefined when trying to checkout.
     */
    public checkout(cashier: Cashier): Receipt {

        //precondition: the cart should not be empty, otherwise there is nothing to checkout
        // we throw an exception in that case to let the view know. The exception is thrown from cart.
        //no postconditions to check, if the cart is empty, the method simply alerts the receipt view

        //at this point, we can assert that the cart is not empty
        //  this is because the only point where this method is called is after receipt-view is initialized
        //  which means we have also set this.#cart :)
        assert(this.#cart != undefined, "Cart cannot be undefined when we checkout.")

        return this.#cart!.checkout(cashier);
    }

    /**
     * Resets the cart state by creating a new cart, saving it, and updating the cashier's cart.
     * It also reinitializes the `CartView` and `ReceiptView` with the new cart and provided cashier.
     * @param {Cashier} cashier - The cashier whose cart is being reset.
     * @throws {AssertionError} if the cart is undefined when trying to reset.
     */
    public async reset(cashier: Cashier) {

        //there are no preconditions to check for this method, it simply resets the properties
        //perhaps we could use DIP and inject these new instances but this was 
        //said to be just fine in class :)

        //we can assert that cart is not undefined at this point because this method 
        // is called by the receipt-view after a successful checkout which means 
        // that this.#cart is already set :)

        assert(this.#cart != undefined, "Cart cannot be undefined when we reset the cart-controller.")

        this.#cart = new Cart();
        await Cart.saveCart(this.#cart);
        cashier.currentCart = this.#cart;
        await Cashier.saveCashier(cashier);

        this.#cartView = new CartView(this.#cart, this);
        this.#receiptView = new ReceiptView(this, cashier);
    }
}
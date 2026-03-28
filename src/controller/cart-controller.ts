import Cart from '../model/cart.ts';
import Fruit from '../model/Product/fruit.ts';
import Vegetable from '../model/Product/vegetable.ts';
import Receipt from '../model/receipt.ts';

import CartView from '../view/cart-view.ts';
import CreateProductView from '../view/create-product-view.ts';
import ReceiptView from '../view/receipt-view.ts';

/**
 * The `CartController` class manages a shopping cart, allows adding products, displaying a receipt,
 * creating new products, and resetting the cart state.
 */
export default class CartController {

    //this is more like patch-work but for now it is alright
    // for phase 2, this data will be retreived from the
    // product-inventory table in the database
    static readonly fruitPrice = 2;
    static readonly vegetablePrice = 1;

    #cart: Cart;
    #cartView: CartView;
    #receiptView: ReceiptView;
    #createProductView?: CreateProductView;

    constructor() {
        this.#cart = new Cart();
        this.#cartView = new CartView(this.#cart, this);
        this.#receiptView = new ReceiptView(this);
    }

    public addFruitToCart() {

        //we assume that the fruitPrice static variable set internally will never be
        // changed to a negative number
        //no other pre-conditions needed for this method

        this.#cart.addItem(new Fruit(CartController.fruitPrice));

        //no post-conditions needed if the precondition is satisfied
    }

    public addVegetableToCart() {

        //we assume that the vegetablePrice static variable set internally will never be
        // changed to a negative number
        //no other pre-conditions needed for this method

        this.#cart.addItem(new Vegetable(CartController.vegetablePrice));

        //no post-conditions needed if the precondition is satisfied
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
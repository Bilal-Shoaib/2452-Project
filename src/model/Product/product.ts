import { assert } from "../../assertions";
/** 
 * An abstract class named `Product.
 * The class has a`price` price property that must be non-negative
 */
export default abstract class Product {
    readonly price: number;
    
    constructor(price: number) {
        if (price < 0) {
            throw new InvalidPriceException();
        }
        this.price = price;
        this.#checkProduct();
    }
    

    /**
     * The function `checkProduct()` ensures that the price of a product is non-negative.
     */
    #checkProduct() {
        assert(this.price >= 0, "Product price must be non-negative.");
    }
}

//custom exception for invalid price
export class InvalidPriceException extends Error {}
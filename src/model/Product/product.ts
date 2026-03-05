
/** 
 * An abstract class named `Product.
 * The class has an abstract getter method `price` that must be implemented
 * by any class that extends `Product`. 
 */
export default abstract class Product {
    abstract get price(): number;
}

//custom exception for invalid price
export class InvalidPriceException extends Error {}
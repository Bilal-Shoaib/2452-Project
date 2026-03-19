import Product from "./product";

export default class ProductList {
    static #list = new Map<string, Product>();
    public static add(type: string, product: Product): void {
        if (!this.#list.get(type)) {
            this.#list.set(type, product);
        }
    }
    public static get(type: string): Product {
        if (!this.#list.get(type)) {
            throw new NonExistentProductException();
        }
        return this.#list.get(type)!;
    }
    public static getProducts(): Array<Product> {
        return Array.from(this.#list.values());
    }
    public static length(): number {
        return this.#list.size;
    }
}

export class NonExistentProductException extends Error {}
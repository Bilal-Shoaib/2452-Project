import { assert } from "../../assertions.ts";

import type Product from "../Product/product.ts";
import type Coupon from "./coupon.ts";
import type Receipt from "../receipt.ts";

import db from "../connection.ts";

/**
 * The BOGO class implements the Coupon interface.
 * It represents a BOGO (Buy One Get One) coupon that can be applied to a receipt.
 * @implements {Coupon}
 * @property {Product} qualifier - The product that must be purchased to qualify for the BOGO discount.
 * @property {Product} reward - The product that will be discounted if the qualifier product is purchased.
 * @throws {SameBOGOProductsException} If the qualifier and reward products are the same object.
 * @throws {DifferentTypeOfBOGOProductsException} If the qualifier and reward products do not belong to the same class.
 */
export default class BOGO implements Coupon {

    readonly qualifier: Product;
    readonly reward: Product;

    public id?: number;
    constructor(qualifier: Product, reward: Product) {

        if (qualifier == reward) {
            throw new SameBOGOProductsException();
        }

        if (qualifier.constructor !== reward.constructor) {
            throw new DifferentTypeOfBOGOProductsException();
        }

        this.qualifier = qualifier;
        this.reward = reward;

        this.#checkBOGO();
    }

    /**
     * Calculates the savings provided by this BOGO coupon.
     * @returns the amount of savings that will be applied to the receipt when this coupon is used, which is equal to the price of the reward product.
     */
    public calculateSavings(): number {
        return this.reward.price;
    }

    /**
     * Saves this BOGO coupon to the database, associating it with the given receipt ID.
     * @param receipt the receipt to which the coupon should be associated
     * @returns the persisted coupon object with ID field populated
     */
    public async saveCoupon(receipt: Receipt): Promise<Coupon> {
        return await BOGO.saveBOGO(this, receipt);
    }

    /**
     * Validates the BOGO coupon's properties.
     * It asserts that the qualifier and reward products are distinct objects,
     *  belong to the same class,
     *  and that the amount discounted is equal to the price of the reward product
     *  and amount discounted is non-negative.
     * @throws {AssertionError} if any of the assertions fail.
     */
    #checkBOGO() {
        assert(this.qualifier != this.reward, "BOGO must be applied to distinct products.");
        assert(this.qualifier.constructor === this.reward.constructor, "Both products in BOGO must belong to the same class.");
    }

    /**
     * The `getAvailableBOGOs` function checks for valid BOGO (Buy One Get One) offers based on
     * the products in the receipt and adds the corresponding BOGO coupons to the provided array.
     * @param {Cart} receipt - The shopping cart containing the products to check for BOGO offers.
     * @return {Array<BOGO>} An array of BOGO coupons that are applicable to the products in the receipt.
     */
    public static getAvailableBOGOs(receipt: Receipt): Array<BOGO> {
        const bogos = new Array<BOGO>();
        //? Use a string key because JavaScript Maps compare object keys by reference,
        //? not by value (no .equals() like Java). This ensures correct grouping.
        const productMap = new Map<string, Array<Product>>();

        for (const item of receipt.cart) {

            const mapKey = `${item.constructor.name}-${item.price}`;
            
            if (productMap.has(mapKey)) {
            
                const bogoPair = productMap.get(mapKey);
            
                if (bogoPair!.length <= 1 && bogoPair!.at(0)!.id! != item.id!) {
                    bogos.push(new BOGO(bogoPair!.at(0)!, item));
                    bogoPair!.push(item);
                }
            
            } else {
                productMap.set(mapKey, [item]);
            }
        }

        return bogos;
    }

    /**
     * Saves the given BOGO coupon to the database, associating it with the given receipt ID.
     * @param bogo the BOGO coupon to be persisted to the db
     * @param receipt the receipt to which the coupon should be associated
     * @returns the persisted BOGO object with ID field populated
     * @throws {AssertionError} if the receipt does not have an ID 
     * or if the database operation fails to return an ID for the saved BOGO coupon.
     */
    public static async saveBOGO(bogo: BOGO, receipt: Receipt): Promise<BOGO> {

        assert(receipt.id != undefined, "Receipt must be saved before saving associated BOGO coupons.");
        
        let result = await db().query<{id: number}>(
            "insert into bogo(id, qualifier_id, reward_id, receipt_id) values(default, $1, $2, $3) on conflict do nothing returning id",
            [bogo.qualifier.id, bogo.reward.id, receipt.id!]
        )

        if (!bogo.id) {
            bogo.id = result.rows[0].id;
        }

        assert(bogo.id != undefined, "Failed to save BOGO coupon to the database.");

        return bogo;
    }

    /**
     * Gets all the BOGO coupons associated to a receipt
     * @param receipt the receipt for which to retrieve BOGO coupons
     * @returns an array of BOGO objects associated with the receipt
     * @throws {AssertionError} if the receipt does not have an ID 
     * or if any of the products associated with the retrieved BOGO coupons are undefined.
     */
    public static async getBOGO(receipt: Receipt): Promise<Array<BOGO>> {

        assert(receipt.id != undefined, "Receipt must be saved before retrieving associated BOGO coupons.");

        const results = await db().query<{id:number, qualifier_id: number, reward_id: number}>(
            "select id, qualifier_id, reward_id from bogo where receipt_id = $1",
            [receipt.id]
        );

        const bogos = new Array<BOGO>();

        for(let row of results.rows) {
            const qualifier = receipt.cart.getProductWithID(row.qualifier_id);
            const reward = receipt.cart.getProductWithID(row.reward_id);

            assert(qualifier != undefined, "Qualifier product with BOGO applied must be in cart.");
            assert(reward != undefined, "Reward product with BOGO applied must be in cart.");

            const bogo = new BOGO(qualifier, reward);
            bogo.id = row.id;

            bogos.push(bogo);
        }
        return bogos;
    }

}

export class SameBOGOProductsException extends Error {}
export class DifferentTypeOfBOGOProductsException extends Error {}
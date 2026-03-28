import { assert } from "../../assertions.ts";

import type Coupon from "./coupon.ts";
import db from "../connection.ts";
import type Receipt from "../receipt.ts";

/**
 * The Discount class implements the Coupon interface. 
 * It represents a discount that can be applied to a receipt.
 * @implements {Coupon}
 * @property {number} amount - The amount of the discount.
 * @throws {InvalidDiscountAmountException} If the amount is negative.
 */
export default class Discount implements Coupon {
    readonly amount: number;
    public id?: number;

    constructor(amount: number) {
        if (amount < 0) {
            throw new InvalidDiscountAmountException();
        }

        this.amount = amount;

        this.#checkDiscount();
    }

    /**
     * Saves this discount coupon to the database, associating it with the given receipt ID.
     * @param receipt the receipt to which the coupon should be associated
     * @returns the persisted coupon object with ID field populated
     */
    public async saveCoupon(receipt: Receipt): Promise<Coupon> {
        return await Discount.saveDiscount(this, receipt);
    }

    /**
     * Validates the discount's properties.
     * @throws {AssertionError} if the discount amount is negative.
     */
    #checkDiscount() {
        assert(this.amount >= 0, "Discount amount must be non-negative");
    }

    /**
     * Saves the given discount coupon to the database, associating it with the given receipt ID.
     * @param discount the discount coupon to be persisted to the db
     * @param receipt the receipt to which the coupon should be associated
     * @returns the persisted discount object with ID field populated
     * @throws {AssertionError} if the receipt does not have an ID 
     * or if the discount could not be saved to the database.
     */
    public static async saveDiscount(discount: Discount, receipt: Receipt): Promise<Discount> {

        assert(receipt.id != undefined, "Receipt must be saved before saving associated discount coupons.");

        let result = await db().query<{id: number}>(
            "insert into discount(id, amount, receipt_id) values(default, $1, $2) on conflict do nothing returning id",
            [discount.amount, receipt.id!]
        )

        if (!discount.id) {
            discount.id = result.rows[0].id;
        }

        assert(discount.id != undefined, "Failed to save discount coupon to the database.");

        return discount;
    }

    /**
     * Gets all the discount coupons associated to a receipt
     * @param receipt the receipt for which to retrieve discount coupons
     * @returns an array of discount objects associated with the receipt
     * @throws {AssertionError} if the receipt does not have an ID.
     */
    public static async getDiscount(receipt: Receipt): Promise<Array<Discount>> {

        assert(receipt.id != undefined, "Receipt must be saved before retrieving associated discount coupons.");
        
        const results = await db().query<{id: number, amount: number}>(
            "select id, amount from discount where receipt_id = $1",
            [receipt.id!]
        );

        const discounts = new Array<Discount>();

        for(let row of results.rows) {

            const discount = new Discount(row.amount);
            discount.id = row.id;

            discounts.push(discount);
        }

        return discounts;
    }

}

export class InvalidDiscountAmountException extends Error {}
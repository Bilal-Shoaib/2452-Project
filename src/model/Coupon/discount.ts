import { assert } from "../../assertions.ts";

import db from "../connection.ts";
import type Coupon from "./coupon.ts";
import type Receipt from "../receipt.ts";

/**
 * The DiscountThreshold class is only used within the Receipt class to represent
 * a discount threshold amount a it's corresponding discount percantage.
 * @property {number} cost - The minimum total cost required to qualify for the discount.
 * @property {number} discountPercent - The percentage of the total cost that will be discounted if the threshold is met.
 */
class DiscountThreshold {

    readonly cost: number;
    readonly discountPercent: number;
    
    constructor(cost: number, discountPercent: number) {
        this.cost = cost;
        this.discountPercent = discountPercent;
    }
}

/**
 * The Discount class implements the Coupon interface. 
 * It represents a discount that can be applied to a receipt.
 * @implements {Coupon}
 * @property {number} amount - The amount of the discount.
 * @throws {InvalidDiscountAmountException} If the amount is negative.
 */
export default class Discount implements Coupon {

    private static DISCOUNT_THRESHOLDS: DiscountThreshold[] = [
        //multiples of 4 result in an integer when muliplied by one of the 'quarterly' percentages
            //where we define a 'quarterly' percentage as percentages that are multiples of 25.
        new DiscountThreshold(4, 0.25),
        new DiscountThreshold(16, 0.50),
        new DiscountThreshold(32, 0.75)
    ];

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
     * Calculates the savings provided by this discount coupon.
     * @returns the amount of savings that will be applied to the receipt when this coupon is used.
     */
    public calculateSavings(): number {
        return this.amount;
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
     * The `getAvailableDiscounts` function checks if the total cost of the receipt meets any predefined discount thresholds and adds the corresponding discount coupons to the provided array.
     * It iterates through the discount thresholds in descending order and applies the first applicable discount based on the total cost.
     * @param {number} totalCost - The total cost of the receipt before discounts.
     * @returns {Array<Coupon>} - The array to which valid discount coupons will be added.
     */
    public static getAvailableDiscounts(receipt: Receipt): Array<Discount> {
        const discounts = new Array<Discount>();
        
        let discountApplied = false;
        let i = Discount.DISCOUNT_THRESHOLDS.length-1;
        
        while(!discountApplied && i >= 0) {
            const threshold = Discount.DISCOUNT_THRESHOLDS.at(i)!;
            
            if (receipt.totalCost >= threshold.cost) {
                const amountDiscounted = receipt.totalCost * threshold.discountPercent;
                discounts.push(new Discount(amountDiscounted));
                discountApplied = true;
            }
            
            i--;
        }

        return discounts;
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
import type Receipt from "../receipt";

/**
 * The coupon interface represents Discounts and BOGOs that can be applied to a receipt.
 * It has a method to save the coupon to the database, which returns a promise that resolves to the coupon itself.
 * It also has a method to calculate the savings provided by the coupon.
 */
export default interface Coupon {
    calculateSavings(): number;
    saveCoupon(receipt: Receipt): Promise<Coupon>
}
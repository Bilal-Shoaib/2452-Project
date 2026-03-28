import type Receipt from "../receipt";

/**
 * The coupon interface represents Discounts and BOGOs that can be applied to a receipt.
 * It has a method to save the coupon to the database, which returns a promise that resolves to the coupon itself.
 * The amount property represents the discounted amount that will be applied to the receipt.
 */
export default interface Coupon {
    readonly amount: number;
    saveCoupon(receipt: Receipt): Promise<Coupon>
}
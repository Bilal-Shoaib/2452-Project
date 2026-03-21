export default interface Coupon {
    readonly amount: number;
    saveCoupon(receiptID: number): Promise<Coupon>
}

//custom exception for invalid price
export class InvalidDiscountException extends Error {}
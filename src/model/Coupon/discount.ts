import { assert } from "../../assertions.ts";

import type Coupon from "./coupon.ts";
import db from "../connection.ts";

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

    public async saveCoupon(receiptID: number): Promise<Coupon> {
        return await Discount.saveDiscount(this, receiptID);
    }


    #checkDiscount() {
        assert(this.amount >= 0, "Discount amount must be non-negative");
    }

    public static async saveDiscount(discount: Discount, receiptID: number): Promise<Discount> {

        let result = await db().query<{id: number}>(
            "insert into discount(id, amount, receipt_id) values(default, $1, $2) on conflict do nothing returning id",
            [discount.amount, receiptID]
        )

        if (!discount.id) {
            discount.id = result.rows[0].id;
        }

        return discount;
    }

    public static async getDiscount(receiptID: number): Promise<Array<Discount>> {
        const results = await db().query<{id: number, amount: number}>(
            "select id, amount from discount where receipt_id = $1",
            [receiptID]
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
import { assert } from "../../assertions.ts";

import type Product from "../Product/product.ts";
import type Coupon from "./coupon.ts";
import db from "../connection.ts";
import type Receipt from "../receipt.ts";

export default class BOGO implements Coupon {

    readonly qualifier: Product;
    readonly reward: Product;
    readonly amount: number;

    public id?: number;

    constructor(qualifier: Product, reward: Product) {

        if (qualifier == reward) {
            throw new NonSeparateProductException();
        }

        if (qualifier.constructor !== reward.constructor) {
            throw new IndistinctProductTypeException();
        }

        this.qualifier = qualifier;
        this.reward = reward;

        this.amount = reward.price;

        this.#checkBOGO();
    }

    public async saveCoupon(receiptID: number): Promise<Coupon> {
        return await BOGO.saveBOGO(this, receiptID);
    }

    #checkBOGO() {
        assert(this.qualifier != this.reward, "BOGO must be applied to distinct products.");
        assert(this.qualifier.constructor === this.reward.constructor, "Both products in BOGO must belong to the same class.");
        assert(this.amount == this.reward.price, "The amount discounted must be the cost of the reward product.");
        assert(this.amount > 0, "The discounted amount must be non-negative.")
    }

    public static async saveBOGO(bogo: BOGO, receiptID: number): Promise<BOGO> {
        
        let result = await db().query<{id: number}>(
            "insert into bogo(id, qualifier_id, reward_id, receipt_id) values(default, $1, $2, $3) on conflict do nothing returning id",
            [bogo.qualifier.id, bogo.reward.id, receiptID]
        )

        if (!bogo.id) {
            bogo.id = result.rows[0].id;
        }

        return bogo;
    }

    public static async getBOGO(receipt: Receipt): Promise<Array<BOGO>> {
        const results = await db().query<{id:number, qualifier_id: number, reward_id: number}>(
            "select id, qualifier_id, reward_id from bogo where receipt_id = $1",
            [receipt.id]
        );

        const bogos = new Array<BOGO>();

        for(let row of results.rows) {
            const qualifier = receipt.cart.getProductWithID(row.qualifier_id);
            const reward = receipt.cart.getProductWithID(row.reward_id);

            assert(qualifier != undefined, "Product 1 with BOGO applied must be in cart.");
            assert(reward != undefined, "Product 2 with BOGO applied must be in cart.");

            const bogo = new BOGO(qualifier, reward);
            bogo.id = row.id;

            bogos.push(bogo);
        }

        return bogos;
    }

}

export class NonSeparateProductException extends Error {}
export class IndistinctProductTypeException extends Error {}
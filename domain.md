---
title: Domain model for my POS-SYS project
author: Bilal Shaikh (shaikhb2@myumanitoba.ca)
date: Winter 2026
---

# Domain model

```mermaid
classDiagram
    class Product {
        <<abstract class>>
        - number price

        +~? number id

        + get price() number
        + abstract clone() Product

        + static saveProduct(Product product, number cartID) Promise~Product~
        + static getProducts(Cart cart) Promise~Cart~
    }
    note for Product "Class invariants: <ul>
    <li> price is a non-negative number
    </ul>"

    class Fruit {
        + clone() Fruit
    }
    
    class Vegetable {
        + clone() Vegetable
    }

    class Smoothie {
        -? number quantity

        + set quantity(number quantity)
        + get quantity() number | undefined
        + clone() Smoothie
    }

    class Coupon {
        <<interface>>
        + readonly number amount
        + saveCoupon(number receiptID) Promise~Coupon~
    }

    class BOGO {
        + readonly Product qualifier
        + readonly Product reward
        + readonly number amount

        +~? number id

        + saveCoupon(number receiptID) Promise~Coupon~

        + static saveBOGO(BOGO bogo, number receiptID) Promise~BOGO~
        + static getBOGO(receipt: Receipt) Promise~Array~BOGO~~
    }
    note for BOGO "Class invariants: <ul>
    <li> qualifier is not equal to reward
    <li> qualifier and reward belong to the same subclass of Product
    <li> amount is equal to reward.price
    <li> amount is non-negative
    </ul>"

    class Discount {
        + readonly number amount

        +~? number id

        + saveCoupon(number receiptID) Promise~Coupon~

        + static saveDiscount(Discount discount, number receiptID) Promise~Discount~
        + static getDiscount(receiptID: number) Promise~Array~Discount~~
    }
    note for Discount "Class invariants: <ul>
    <li> amount is non-negative
    </ul>"

    class Cart {
        + readonly products Array~Product~

        +~? number id

        + checkout() Receipt
        + addItem(Product item) void
        + contains(Product item) boolean
        + getProductWithID(number id) Product | undefined
        + isEmpty() boolean

        + static saveCart(Cart cart) Promise~Cart~
    }
    note for Cart "Class invariants: <ul>
    <li> products can be empty, but never null
    </ul>"
    
    class Receipt {
        <<record>>
        + readonly Cart cart
        + readonly Cashier cashier
        + readonly Temporal.Instant timestamp
        
        - number totalCost
        - number totalDiscount

        - Array<Coupon> appliedCoupons
        - Array<Coupon> availableCoupons
        
        +~? number id

        + applyCoupon(Coupon coupon)

        + get total() number
        + get availableCoupons() Array~Coupon~
        + get appliedCoupons() Array~Coupon~

        - static getAvailableCoupons(Receipt receipt) Array~Coupon~
        - static addValidDiscounts(number totalCost, Array~Coupon~ coupons) void
        - static addValidBOGOs(Cart cart, Array~Coupon~ coupons) void
        - static calculateTotal(Cart cart) number

        + static saveReceipt(Receipt receipt) Promise~Receipt~
    }
    note for Receipt "Class invariants: <ul>
    <li> cart must be non-null and non-empty
    <li> cashier is never null
    <li> timestamp is never null
    </ul>"

    class Cashier {
        +~ readonly string name
        + readonly string password

        - Cart cart

        + get cart() Cart
        + set cart(Cart cart) void

        + static saveCashier(Cashier cashier) Promise~Cashier~
        + static getCashier(string name, string password) Promise~Cashier~
        + static newCashier(string name, string password) Promise~Cashier~
    }
    note for Cashier "Class invariants: <ul>
    <li> name is never null and is non-empty
    <li> password is never null and is non-empty
    <li> cart is never null
    </ul>"

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Specifications %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    Fruit --|> Product
    Vegetable --|> Product
    Smoothie --|> Product

    BOGO --|> Coupon
    Discount --|> Coupon
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Relationships %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

    Cart "1" --* "*" Product
    
    Receipt "1" --* "1" Cart
    Receipt "1" --* "*" Coupon 
    Receipt "*" --o "1" Cashier   
    Cashier "*" --* "1" Cart
```

Comments for Phase-2 Design:

1. Product subclasses (i.e., Fruit) do not have any properties of their own, they only initialize the Product superclass and clone themselves when needed.
2. BOGO and Discount have different properties and different tables in the database. To save an instance of a BOGO or a Discount while adhering to OCP, I had to define the saveCoupon method in the Coupon interface that leaves specific persisting details to the implementations.
3. The Cart class does not have a static getCart method because we store the cart's id in the cashier table when we persist a cashier. A (perhaps positive) side-effect of this is that when reconstructing a cashier, we can always create a new cart, assign it the persisted id and get products associated to that cart id.
4. A receipt is supposed to store a snapshot of the current cart in the system. To enforce this design decision, receipts are only persisted into the database after checkout is complete. A (perhaps positive) side-effect of this is that during receipt-view (after 'Proceed to Checkout' button is clicked) if the page is refreshed, no receipts are uselessly persisted into the database when the checkout process was not fully finished. I have also decided to not provide an option for backing out of the receipt-view for simplicity.
5. The Cashier class has two seemingly 'identical' methods called getCashier and newCashier. The difference of these lies in the usage and error communication (feedback). The getCashier method is only used when a cashier tries to log in to the system, the assumption going into this method is that the cashier credentials would exist in the database. Hence a valid error state is not finding the given cashier and/or a password mismatch. The newCashier method is only used when a new cashier instance is being added to the system, hence a valid error state is finding a cashier with the same 'unique' credential (name).
6. IMPORTANT NOTE: In all classes where a serial id is the unique key, it is defined nullable because it is the database's responsibility to assign ids to object when persisted for the first time.
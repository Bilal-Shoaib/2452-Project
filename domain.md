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

        +~ number id

        + get price() number
        + abstract clone() Product

        + static saveProduct(Product product, Cart cart) Promise~Product~
        + static getProductsForCart(Cart cart) Promise~Array~Product~~
        - static getConstructorArguments(databaseRow) any[]
    }
    note for Product "Class invariants: <ul>
    <li> price is a non-negative number
    </ul>"

    class ProductWithQuantity {
        <<abstract class>>
        - number quantity

        + get quantity() number
        + set quantity(number quantity)

        + totalPrice() number
        + abstract clone() ProductWithQuantity
    }
    note for ProductWithQuantity "Class invariants:
    <ul>
    <li> quantity is a non-negative number
    </ul>"

    class Fruit {
        + clone() Fruit
    }
    
    class Vegetable {
        + clone() Vegetable
    }

    class Smoothie {
        + clone() Smoothie
    }

    class Coupon {
        <<interface>>
        + calculateSavings() number
        + saveCoupon(Receipt receipt) Promise~Coupon~
    }

    class BOGO {
        + readonly Product qualifier
        + readonly Product reward

        +~ number id

        + calculateSavings() number
        + saveCoupon(Receipt receipt) Promise~Coupon~

        + static getAvailableBOGOs(Receipt receipt) Array~BOGO~
        + static saveBOGO(BOGO bogo, Receipt receipt) Promise~BOGO~
        + static getBOGO(Receipt receipt) Promise~Array~BOGO~~
    }
    note for BOGO "Class invariants: <ul>
    <li> qualifier is not equal to reward
    <li> qualifier and reward belong to the same subclass of Product
    </ul>"

    class Discount {
        + readonly number amount

        +~ number id

        + calculateSavings() number
        + saveCoupon(Receipt receipt) Promise~Coupon~

        + static getAvailableDiscounts(Receipt receipt) Array~Discount~
        + static saveDiscount(Discount discount, Receipt receipt) Promise~Discount~
        + static getDiscount(Receipt receipt) Promise~Array~Discount~~
    }
    note for Discount "Class invariants: <ul>
    <li> amount is non-negative
    </ul>"

    class Cart {
        + readonly products Array~Product~

        +~ number id

        + autobuy(number amount): void
        + checkout() Receipt
        + addItem(Product item) void
        + contains(Product item) boolean
        + getProductWithID(number id) Product | undefined
        + isEmpty() boolean

        + static saveCart(Cart cart) Promise~Cart~
        + static populateCart(Cart cart) Promise~Cart~
    }
    note for Cart "Class invariants: <ul>
    <li> products can be empty, but never null
    </ul>"
    
    class Receipt {
        <<record>>
        + readonly Cart cart
        + readonly Cashier cashier
        + readonly Temporal.Instant timestamp
        
        + readonly number totalCost
        - number totalSavings

        + readonly Array<Coupon> appliedCoupons
        
        +~ number id

        + applyCoupon(Coupon coupon)

        + get total() number

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

        + Cart currentCart

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
    ProductWithQuantity --|> Product

    Fruit --|> Product
    Vegetable --|> Product
    Smoothie --|> ProductWithQuantity

    BOGO --|> Coupon
    Discount --|> Coupon
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Relationships %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

    Cart "1" --* "*" Product
    
    Receipt "1" --* "1" Cart
    Receipt "1" --* "*" Coupon 
    Receipt "*" --o "1" Cashier   
    Cashier "*" --* "1" Cart
```

Comments for Design:

1. Product subclasses (i.e., Fruit) do not have any properties of their own, they only initialize the Product superclass and clone themselves when needed.
2. BOGO and Discount have different properties and different tables in the database. To save an instance of a BOGO or a Discount while adhering to OCP, I had to define the saveCoupon method in the Coupon interface that leaves specific persisting details to the implementations.
3. A receipt is supposed to store a snapshot of the current cart in the system. To enforce this design decision, receipts are only persisted into the database after checkout is complete. A (perhaps positive) side-effect of this is that during receipt-view (after 'Proceed to Checkout' button is clicked) if the page is refreshed, no receipts are uselessly persisted into the database when the checkout process was not fully finished. I have also decided to not provide an option for backing out of the receipt-view for simplicity.
4. The Cashier class has two seemingly 'identical' methods called getCashier and newCashier. The difference of these lies in the usage and error communication (feedback). The getCashier method is only used when a cashier tries to log in to the system, the assumption going into this method is that the cashier credentials would exist in the database. Hence a valid error state is not finding the given cashier and/or a password mismatch. The newCashier method is only used when a new cashier instance is being added to the system, hence a valid error state is finding a cashier with the same 'unique' credential (name).
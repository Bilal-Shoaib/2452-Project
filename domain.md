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
        + readonly price number
    }

    class Fruit {
        + readonly number price
        + readonly cart Cart
    }
    note for Fruit "Class invariants: <ul>
    <li> price is a non-negative number
    <li> cart is never null
    </ul>"
    
    class Vegetable {
        + readonly number price
        + readonly Cart cart
    }
    note for Vegetable "Class invariants: <ul>
    <li> price is a non-negative number
    <li> cart is never null
    </ul>"

    class Cart {
        - readonly Array~Product~ products
        + readonly Cashier cashier

        + checkout() Receipt
        + addItem(Product item) void
        + contains(Product item) boolean
        + isEmpty() boolean
    }
    note for Cart "Note: <ul>
    <li> products can be empty, but never null
    <li> cashier is never null
    </ul>"
    
    class Receipt {
        <<record>>
        + readonly Cart cart
        + readonly Cashier cashier

        + get total() number
    }
    note for Receipt "Note: <ul>
    <li> cart can be empty, but never null
    <li> cashier is never null
    </ul>"

    class Cashier {
        + readonly string name
        + readonly string password

        - Array~Cart~ currentCarts
        - Array~Receipt~ receiptRecord

        + static getAllCashiers() Array~Cashier~
        + generateReceipt(Cart cart) Receipt
    }
    note for Cashier "Note: <ul>
    <li> name is never null and is non-empty
    <li> password is never null and is non-empty

    <li> currentCarts is never null
    <li> receiptRecord is never null
    </ul>"

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Specifications %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    Fruit --|> Product
    Vegetable --|> Product
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Relationships %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    Fruit --o Cart
    Vegetable --o Cart

    Cart --* Product
    Cart --o Cashier
    
    Receipt --* Cart
    Receipt --o Cashier
    
    Cashier --* Cart
    Cashier --* Receipt
```

Some more information about these domain objects:
1. A Product can be of two types: Fruit and Vegetable. A product also has a price. The price is implied by the total cost on the receipt.
2. Cart is just a wrapper for an array (list in java) that stores products and provides limited functionality/usage of this array. In reality, you might also want to remove items from the cart, but the project description says nothing of the sort, MVP.
3. Receipt contains a reference to the cart. We can generate a summary of all the items in the cart and their quantities. We can also access the total price for all the items in the cart. In reality, we also have other details such as date, applied ongoing discounts etc., but we won't implement them for now, MVP.
4. We don't define checking properties against null since typescript does not need that assertion.
5. The receipt object does not need a summarize() method because I intend to treat the receipt class similar to a java object. It is only supposed to store a 'snapshot' of the cart once the checkout process is initialized. The receipt object itself is supposed to be the summary of cart. Receipt-View will be responsible for the exact details of how a receipt is shown on screen.

Changelog:
1. Added methods to Cart: contains, isEmpty, checkout
2. Removed method from Cart: totalPrice
3. Added method to Receipt: items
4. Removed method from Receipt: summarizeItems
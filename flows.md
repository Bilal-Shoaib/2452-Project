---
title: Flows of interaction for my POS-SYS project
author: Bilal Shaikh (shaikhb2@myumanitoba.ca)
date: Winter 2026
---

# Flows of interaction

## 1. Log-in

Enter cashier credentials and log-in.
```mermaid
flowchart
  subgraph **Login Flow**
    loginScreen[[Login Screen]]
    enterCredentials{Enter Cashier Credentials}
    verifyLogin{Verify Credentials}
    cashierView[[Cashier Screen]]
    addCashierPopup[Add New Cashier Popup]

    loginScreen -.'Add New Cashier' <br> Button is clicked.-> addCashierPopup
    addCashierPopup ==log-in successful <br> input: cashier==> cashierView

    loginScreen -.'Log in' <br> Button is clicked.-> enterCredentials
    enterCredentials ==input: Name & Password==> verifyLogin

    verifyLogin -.error: invalid name <br> re-enter credentials.-> enterCredentials
    verifyLogin -.error: invalid password <br> re-enter credentials.-> enterCredentials
    verifyLogin -.error: cashier credentials not found <br> re-enter credentials.-> enterCredentials

    verifyLogin ==log-in successful <br> input: cashier==> cashierView
  end
```

## 2. Add New Cashier

Enter credentials for a new cashier and log-in.
```mermaid
flowchart
  subgraph **Add New Cashier**
    addCashierPopup[Add New Cashier]
    enterCredentials{Enter Cashier Credentials}
    verifyCashier{Verify New Cashier}
    cashierScreen[[Cashier Screen]]

    addCashierPopup -.'Enter credentials into input fields'.-> enterCredentials

    enterCredentials =='Add Cashier'<br> Button is clicked <br> input: Name & Password'==> verifyCashier

    verifyCashier -.error: cashier name already exists.-> enterCredentials

    verifyCashier ==login successful <br> input: Cashier==> cashierScreen
  end
```

## 3. Add Items to Cart

Enter product details and add it to cart for a cashier.

```mermaid
flowchart
  subgraph **Add Item to Cart**

    cashierScreen[[Cashier Screen]]
    productDetail[Enter Product Details]
    addToCart{Add Product to Cart}
    
    cashierScreen -.'Add Product to Cart' Button is clicked.-> productDetail
    productDetail ==Created Product==>addToCart
    addToCart -.Product is added to Cart.-> cashierScreen
  end
```

## 4. Check Out

Check out and create a receipt summarizing the items purchased and their total cost.

```mermaid
flowchart
  subgraph **Check Out**
    cashierScreen[[Cashier Screen]]
    receipt[Show Receipt]
    checkOut{Process Cart Checkout}
    cashierScreen =='Proceed to Checkout' Button is clicked input: Cart==> checkOut
    checkOut -.no items to check out.->cashierScreen
    checkOut ==check out successful: receipt generated input: Receipt==>receipt
    receipt-.'Complete Checkout' Button is clicked.->cashierScreen
  end
```

## 5. Show Receipt
Show an interactable receipt before order confirmation.

```mermaid
flowchart
  subgraph **Complete Checkout**
    receipt[[Show Receipt]]
    applyCoupon{Apply Coupon}
    cashierScreen[[Cashier Screen]]

    receipt -.'Apply Coupon'<br>Button is clicked.-> applyCoupon
    applyCoupon ==coupon applied:<br>updated receipt==> receipt

    receipt -.'Complete Checkout' Button is clicked.-> cashierScreen
  end
```

## 6. Auto-Buy
Automatically buys products for the user with the given amount.

```mermaid
flowchart
  subgraph **Auto-Buy**
    cashierScreen[[Cashier Screen]]
    enterAmount[Enter Auto-Buy Amount]
    addProducts{Add Products Automatically}

    cashierScreen -.'Auto-Buy Products'<br>Button is clicked.-> enterAmount
    enterAmount ==input: Amount==>
    addProducts ==products automatically added to cart:<br>updated cart==> cashierScreen

  end
```

Comments for Design:

1. A Cashier Screen is the main screen shown during the order building process (before check out but also not idle). It will show the cart so far (list of items scanned) and also an option to check out. In reality, we might also have the option to remove items from cart, but that is not described by the project description.
2. Viewing a product and adding it to cart has no error path. Once an item is scanned, it's details will be shown and it will be added to cart directly. There is no decision making/branching logic. We assume an infinite cart, it can never be fully filled.
3. Typically the check out behaviour is not defined for an empty cart, this is just a convention I have opted for.
4. After log-in, we always start at the Cashier Screen and no matter what task is performed, once completed, we return back to the Cashier Screen.
5. Note that the Log-in screen is the main screen shown whenever the website is loaded/refreshed.
import ddl from '../create-tables.sql?raw';
import db from './model/connection.ts';

import CashierController from "./controller/cashier-controller.ts";
import CartController from "./controller/cart-controller.ts";

import Fruit from './model/Product/fruit.ts';
import Vegetable from './model/Product/vegetable.ts';
import Smoothie from './model/Product/smoothie.ts';

import ProductList from './model/Product/Factory/product-list.ts';

//load tables into our db
db().exec(ddl);

// Register Product subclasses in both DB and Factory
registerProducts();
ProductList.populate();

// Entry point of the application
new CashierController(new CartController(ProductList.registry));

// All subclasses of Product must be registered here in main.ts
function registerProducts() {
    Fruit.register();
    Vegetable.register();
    Smoothie.register();
}
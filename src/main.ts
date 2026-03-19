import ddl from '../create-tables.sql?raw';
import db from './model/connection.ts';

import CashierController from "./controller/cashier-controller.ts";
import CartController from "./controller/cart-controller.ts";
import ProductList from './model/Product/product-list.ts';

import Fruit from './model/Product/fruit.ts';
import Vegetable from './model/Product/vegetable.ts';

//load tables into our db
db().exec(ddl);
await registerProducts();

// Entry point of the application
new CashierController(new CartController(ProductList.getProducts()));


async function registerProducts() {
    await Fruit.register();
    await Vegetable.register();
}
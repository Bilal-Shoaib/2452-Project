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

// ALL subclasses of Product must be registered here in main.ts

/** IMPORTANT: 
 * The only other alternative to the factory method would be to have static methods
 * in each product subclass to retreive all products of that
 * type from the inventory table, but this would mean Product-List 
 * would need to know about all subclasses of Product, and call those static methods to populate the registry. 
 * This would violate OCP, as we would need to modify ProductList every time we add a new product type. 
 * By having a register method in each product subclass, we can simply call that 
 * method in main.ts (which is more 'accessible') without needing to modify any existing 
 * code (elsewhere) when adding new product types.
 * 
 * I do want to improve this design to be more scalable. Please provide any feedback on how to improve it :)
 */
function registerProducts() {
    Fruit.register();
    Vegetable.register();
    Smoothie.register();
}
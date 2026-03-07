import ddl from '../create-tables.sql?raw';
import db from './model/connection.ts';

import CashierController from "./controller/cashier-controller.ts";
import CartController from "./controller/cart-controller.ts";

//load tables into our db
db().exec(ddl);

// Entry point of the application
new CashierController(new CartController());
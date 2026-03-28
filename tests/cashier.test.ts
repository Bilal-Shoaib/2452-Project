import {expect, test} from 'vitest';
import Cashier, { CashierFoundException, CashierNotFoundException, InvalidNameException, InvalidPasswordException, PasswordMismatchException } from '../src/model/cashier';
import Cart from '../src/model/cart';

test("Cannot create a cashier without a name", () => {
    const cart = new Cart();
    expect(() => new Cashier("", "a", cart)).toThrow(InvalidNameException);
});

test("Cannot create a cashier without a password", () => {
    const cart = new Cart();
    expect(() => new Cashier("a", "", cart)).toThrow(InvalidPasswordException);
});

test("New cashier creation hashes the password", async () => {
    const name = "test_cashier_1";
    const password = "test_password_1";
    const cashier = await Cashier.newCashier(name, password);

    expect(cashier.name).toBe(name);
    expect(cashier.password).not.toBe(password);
    expect(cashier.password.length).toBe(64);
});

test("Cashier cart getter and setter work correctly", () => {
    const cart = new Cart();
    const cashier = new Cashier("a", "a", cart);
    expect(cashier.cart).toBe(cart);

    const newCart = new Cart();
    cashier.cart = newCart;
    expect(cashier.cart).toBe(newCart);
});

test("Can persist and retrieve a cashier from the database", async () => {
    const name = "test_cashier_2";
    const password = "test_password_2";
    
    const cashier = await Cashier.newCashier(name, password);

    const retrievedCashier = await Cashier.getCashier(name, password);

    expect(retrievedCashier.name).toBe(cashier.name);
    expect(retrievedCashier.password).toBe(cashier.password);
    expect(retrievedCashier.cart.id).toBe(cashier.cart.id);
});

test("Cannot retrieve a cashier with the wrong password", async () => {
    const name = "test_cashier_3";
    const password = "test_password_3";

    await Cashier.newCashier(name, password);
    await expect(Cashier.getCashier(name, "wrong_password")).rejects.toThrow(PasswordMismatchException);
});

test("Cannot retrieve a non-existent cashier", async () => {
    await expect(Cashier.getCashier("non_existent_cashier", "password")).rejects.toThrow(CashierNotFoundException);
});

test("Cannot create a cashier with a name that already exists", async () => {
    const name = "test_cashier_4";
    const password = "test_password_4";
    await Cashier.newCashier(name, password);

    await expect(Cashier.newCashier(name, "another_password")).rejects.toThrow(CashierFoundException);
});
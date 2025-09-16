// @ts-check

import { expect, test } from "@playwright/test";
import fs from "fs";
import { parse } from "yaml";

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

const FILE = fs.readFileSync("conf.yaml", "utf8");
const CONF = parse(FILE);
const ZIP = "123456";

CONF.testUsers.forEach(({ username, password, expect_login_err_message }) => {
  test(`Scenario with ${username}`, async ({ page }) => {
    console.log(`Navigating to URL ${CONF.url}`);
    await page.goto(CONF.url);

    console.log("Filling login form with user:", username);
    await page.locator("[data-test=username]").fill(username);
    await page.locator('[data-test="password"]').fill(password);

    console.log("Clicking login button...");
    await page.locator('[data-test="login-button"]').click();

    const errorMsg = page.locator('[data-test="error"]');
    const isErrorVisible = await errorMsg.isVisible();

    if (expect_login_err_message) {
      console.log("Test completed! PASS");
      await page.close();
      return;
    } else {
      const errorText = isErrorVisible ? await errorMsg.textContent() : ''
      expect(isErrorVisible, { message: `Login failed: ${errorText}` }).toBe(
        false,
      );
    }

    console.log("Login successful, checking inventory container...");
    expect(page.locator('[data-test="inventory-container"]')).toBeVisible();

    const containerItemsToAdd = page.locator('[data-test="inventory-list"]');
    console.log("Getting items to add...");

    const itemsToAdd = await containerItemsToAdd
      .locator('[data-test*="add"]')
      .evaluateAll((nodes) => nodes.map((n) => n.dataset.test));

    const copyItemsToAdd = [...itemsToAdd];
    let itemInCart = [];

    for (let index = 0; index < 3; index++) {
      // Find a random item
      const itemIndex = getRandomInt(0, copyItemsToAdd.length);
      const item = copyItemsToAdd[itemIndex];

      console.log("Clicking add on item:", item);
      itemInCart.push(item);
      // Remove selected item to avoid duplications
      copyItemsToAdd.splice(itemIndex, 1);

      await page.locator(`[data-test="${item}"]`).click();
    }

    console.log("Opening shopping cart...");
    await page.locator('[data-test="shopping-cart-link"]').click();
    await expect(
      page.locator('[data-test="cart-contents-container"]'),
    ).toBeVisible();

    const cardList = page.locator('[data-test="cart-list"]');
    const itemsInCard = await cardList
      .locator('[data-test*="-title-link"]')
      .evaluateAll((nodes) => nodes.map((n) => n.dataset.test));

    expect(
      itemsInCard.length,
      "Number of items in cart does not match expected",
    ).toBe(itemInCart.length);

    console.log("Proceeding to checkout...");
    await page.locator('[data-test="checkout"]').click();
    expect(page.locator("form")).toBeVisible();

    console.log("Filling checkout information...");
    expect(page.locator('[data-test="checkout-info-container"]')).toBeVisible();

    await page.locator('[data-test="firstName"]').fill(username);
    await page.locator('[data-test="lastName"]').fill(username);
    await page.locator('[data-test="postalCode"]').fill(ZIP);

    console.log("Clicking continue...");
    await page.locator('[data-test="continue"]').click();

    const infoFillError = page.locator('[data-test="error"]');
    const isInfoErrorVisible = await infoFillError.isVisible();

    if (isInfoErrorVisible) {
      const infoErrorText = await infoFillError.textContent();
      expect(infoFillError, {
        message: `Checkout failed: ${infoErrorText}`,
      }).not.toBeVisible();
    }

    expect(page.locator('[data-test="cart-list"]')).toBeVisible();

    console.log("Finishing purchase...");
    await page.locator('[data-test="finish"]').click();

    console.log("Test completed! PASS");
  });
});

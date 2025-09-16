# Config

Config file could be found at `conf.yaml`.

```
url: Website url to run the test for.
testUsers: Array of users to run the scenario for.
    - username: Username for login
      password: Password for login
      expect_login_err_message: If true - validate that login fails for this user
```

# Run

```
yarn install
yarn playwright install
yarn run playwright test
```

# Explanation

### Assumptions on behavior

**Good behavior:**

- Users can log in successfully.
- 3 Items can be added to the cart.
- Checkout information can be filled.
- The purchase completes without errors.
- UI inconsistencies, like misplaced elements (`visual_user`), are noted but not treated as failures as the checkout can processed.

**Expected failures (bad behavior):**

- Certain users, like `locked_out_user`, should be prevented from logging in.

**Unexpected failures**

- Users like `problem_user` or `error_user` may encounter form restrictions or cart limitations (e.g., cannot fill the last name or cannot add more than a fixed number of items).

### Our approach

- **Parameterization of users:** We run the same scenario for multiple user types, distinguishing between those who are expected to succeed and those who are expected to fail.
- **Step-by-step verification:** Each key action (login, adding items, checking out, finishing purchase) is checked for visibility and correctness.
- **Error validation:** If a user is expected to fail, we explicitly check for the appropriate error messages. If a user is expected to succeed, we confirm no errors occur.
- **Randomized item selection:** To cover different item combinations, 3 items are randomly added to the cart, while ensuring duplicates are avoided.
- **Assertions on outcomes:** We validate that the number of items in the cart, the visibility of forms, and the completion of checkout all meet the expected behavior for that user.

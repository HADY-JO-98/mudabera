# Income Usage Graph Implementation Guide (Mobile App)

This guide provides the mathematical formulas, data structures, and logic required to implement the **Income Usage Graph** in the mobile version of the app. It ensures matching calculations and visuals between the mobile and web platforms.

---

## 1. Overview
The Income Usage Graph is an area/line chart showing a **12-month historical breakdown** of how the user's monthly income is distributed between:
1. **Income** (Total baseline reference line)
2. **Variable Expenses** (Logged transactions for each month)
3. **Savings** (Remaining cash buffer)

---

## 2. Mathematical Mapping

To achieve perfect balance, the chart relies on the following variables from the user profile and transaction databases:

### A. Total Income
* **Source:** User's gross salary.
  $$\text{Total Income} = \text{profile.monthlySalary}$$

### B. Fixed Costs (Monthly Commitments)
* **Source:** Sum of standard fixed expenses (Step 3) and recurring optional expenses (Step 4).
  $$\text{Fixed Costs} = \text{Rent} + \text{Utilities (Electricity + Water + Gas)} + \text{Transportation} + \text{Connectivity (Internet + Mobile)} + \text{Step 4 Expenses (Streaming + Education + Medical)}$$

### C. Variable Expenses
* **Source:** The sum of all logged transactions (e.g., food, shopping, coffee) within the specific month.
  $$\text{Variable Expenses} = \sum (\text{Transaction Amounts for Month})$$

### D. Savings (Buffer)
* **Source:** Dynamically calculated as the remainder of the income after subtracting both fixed costs and logged variable expenses.
  $$\text{Savings} = \max(0, \text{Total Income} - \text{Fixed Costs} - \text{Variable Expenses})$$

> [!NOTE]
> This mathematically guarantees a perfect balance where:
> $$\text{Fixed Costs} + \text{Variable Expenses} + \text{Savings} = \text{Total Income}$$

---

## 3. Data Extraction & Fallback Logic

The graph displays a rolling **12-month period** ending with the current month.

### Chronological Sorting
Ensure you generate the date ranges in chronological ascending order (oldest month first, current month last) so the chart plots left-to-right correctly:
```pseudo
for (i = 11 down to 0) {
    targetMonth = currentMonth - i
    // Fetch and sum variable expenses for targetMonth
}
```

### Empty/Historical Month Fallback
If the user has not logged any variable transactions in a past month (i.e., `Variable Expenses == 0`), do not drop the chart line to zero. Instead, apply a standard mock fallback to keep the chart looking populated:
```pseudo
if (VariableExpenses == 0) {
    // Generate a simulated expense based on Fixed Costs
    VariableExpenses = round(FixedCosts * (0.8 + random(0.0 to 0.4)))
}
```

---

## 4. UI & Formatting Guidelines

* **Decimal Rounding (Crucial):** Always format the chart node values and tooltips to exactly **2 decimal places** (e.g., `3695.56 EGP`) using double-precision float rounding to avoid floating-point issues like `3695.5600000000004 EGP`.
* **Colors:**
  * **Income line:** Blue / Neutral Cool (e.g., `hsl(200 85% 50%)`)
  * **Expenses line:** Red / Rose (e.g., `hsl(350 80% 55%)`)
  * **Savings line:** Green / Emerald (e.g., `hsl(160 60% 38%)`)

---

## 5. Sample JSON Structure for Chart
Below is an example structure of the data array you should feed into your chart component (e.g. for a user with `Salary = 10,000 EGP` and `Fixed Costs = 1,700 EGP`):

```json
[
  {
    "month": "March",
    "income": 10000.00,
    "expenses": 4200.00,
    "savings": 4100.00
  },
  {
    "month": "April",
    "income": 10000.00,
    "expenses": 4900.50,
    "savings": 3399.50
  },
  {
    "month": "May",
    "income": 10000.00,
    "expenses": 4604.44,
    "savings": 3695.56
  }
]
```

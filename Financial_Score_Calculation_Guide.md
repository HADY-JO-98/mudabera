# Financial Health Score Calculation Guide for Mobile App Developers

This document explains the mathematical formulas, inputs, and validation logic used to calculate the user's **Financial Health Score** in the Mudaber app. Mobile developers should implement this exact logic to achieve platform parity with the web dashboard.

---

## 1. Input Variables & Preconditions

To calculate the score, the mobile app needs the following four key metrics:

| Variable Name | Description | Source |
|---|---|---|
| `monthlySalary` | User's gross monthly salary / total income | `profile.monthlySalary` |
| `totalFixed` | Sum of all fixed monthly costs + optional services | Calculated from profile |
| `totalExpenses` | Sum of variable expenses logged in the current calendar month | Calculated from current month's expenses |
| `hasActiveBudget` | Boolean indicating if the user has a custom budget plan | True if `budgetAllocations.length > 0` |
| `hasDebts` | Boolean indicating if the user has any active debts | True if `profile.debts.length > 0` |

### A. How to Calculate `totalFixed`
$$\text{Total Fixed Costs} = \text{Sum of Fixed Expenses} + \text{Sum of Optional Expenses}$$

In code:
```javascript
const fixedSum = Object.values(profile.fixedExpenses || {}).reduce((a, b) => a + (b || 0), 0);
const optionalSum = Object.values(profile.optionalExpenses || {}).reduce((a, b) => a + (b || 0), 0);
const totalFixed = fixedSum + optionalSum;
```

### B. How to Calculate `totalExpenses`
Accumulate the `amount` of all expense records where the transaction date (`date`) falls within the **current calendar month and year**:
```javascript
const now = new Date();
const currentMonthExpenses = expensesList.filter(e => {
  const d = new Date(e.date);
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
});
const totalExpenses = currentMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
```

---

## 2. Mathematical Equations

Once you have the inputs, calculate the percentage ratios:

### A. Spent Percentage
$$\text{Spent Percentage} = \text{round}\left( \frac{\text{totalFixed} + \text{totalExpenses}}{\text{monthlySalary}} \times 100 \right)$$
*(If `monthlySalary` is 0, the spent percentage defaults to 0).*

### B. Savings Percentage
$$\text{Savings Percentage} = \max\left(0, 100 - \text{Spent Percentage}\right)$$
*(If `monthlySalary` is 0, the savings percentage defaults to 0).*

---

## 3. Financial Score Algorithm

The score starts at a base value and gains points for healthy financial indicators:

```javascript
let score = 50; // Base Score

// 1. Savings Contribution (Max +20 points)
if (savingsPercentage >= 20) {
  score += 20;
} else if (savingsPercentage >= 10) {
  score += 10;
}

// 2. Debt Contribution (Max +10 points)
if (!hasDebts) {
  score += 10;
}

// 3. Active Budget Contribution (Max +10 points)
if (hasActiveBudget) {
  score += 10;
}

// 4. Low Spending Contribution (Max +10 points)
if (spentPercentage < 80) {
  score += 10;
}

// Clamp final score between 0 and 100
const financialScore = Math.min(100, score);
```

---

## 4. UI Representation & Color Map

Show the score inside a progress gauge or circular meter. Map the score value to these states:

| Score Range | Status (EN) | Status (AR) | Color Hex | Color Semantic |
|---|---|---|---|---|
| $\ge 80$ | Excellent financial health! | وضع مالي ممتاز! | `#10b981` | Green (`text-primary`) |
| $60 \text{ to } 79$ | Good financial health | وضع مالي جيد | `#f59e0b` | Orange / Amber (`text-amber`) |
| $< 60$ | Needs improvement | يحتاج تحسين | `#ef4444` | Red (`text-destructive`) |

---

## 5. Reference Swift / Kotlin Implementations

### Swift (iOS)
```swift
struct FinancialHealthCalculator {
    static func calculateScore(
        salary: Double,
        fixedExpenses: [String: Double],
        optionalExpenses: [String: Double],
        thisMonthExpenses: Double,
        hasActiveBudget: Bool,
        hasDebts: Bool
    ) -> Int {
        guard salary > 0 else { return 0 }
        
        let fixedSum = fixedExpenses.values.reduce(0, +)
        let optionalSum = optionalExpenses.values.reduce(0, +)
        let totalFixed = fixedSum + optionalSum
        
        let spentPercentage = Int(round(((totalFixed + thisMonthExpenses) / salary) * 100.0))
        let savingsPercentage = max(0, 100 - spentPercentage)
        
        var score = 50
        
        if savingsPercentage >= 20 {
            score += 20
        } else if savingsPercentage >= 10 {
            score += 10
        }
        
        if !hasDebts {
            score += 10
        }
        
        if hasActiveBudget {
            score += 10
        }
        
        if spentPercentage < 80 {
            score += 10
        }
        
        return min(100, score)
    }
}
```

### Kotlin (Android)
```kotlin
import kotlin.math.roundToInt

object FinancialHealthCalculator {
    fun calculateScore(
        salary: Double,
        fixedExpenses: Map<String, Double>,
        optionalExpenses: Map<String, Double>,
        thisMonthExpenses: Double,
        hasActiveBudget: Boolean,
        hasDebts: Boolean
    ): Int {
        if (salary <= 0) return 0
        
        val totalFixed = fixedExpenses.values.sum() + optionalExpenses.values.sum()
        val spentPercentage = (((totalFixed + thisMonthExpenses) / salary) * 100.0).roundToInt()
        val savingsPercentage = (100 - spentPercentage).coerceAtLeast(0)
        
        var score = 50
        
        if (savingsPercentage >= 20) {
            score += 20
        } else if (savingsPercentage >= 10) {
            score += 10
        }
        
        if (!hasDebts) {
            score += 10
        }
        
        if (hasActiveBudget) {
            score += 10
        }
        
        if (spentPercentage < 80) {
            score += 10
        }
        
        return minOf(100, score)
    }
}
```

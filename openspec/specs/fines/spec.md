# fines Specification

## Purpose

Calculate and collect overdue loan fines while maintaining an accurate member balance.

## Requirements

### Requirement: Calculate overdue loan fines
The service SHALL calculate each loan's fine in integer cents as 25 times the number of completed 24-hour periods after its due timestamp, capped at 1,000 cents. Open loans accrue through the current instant; returned loans accrue only through their return timestamp. Within one service instance, earlier valid clock readings SHALL be treated as the last successfully observed instant.

#### Scenario: Due and partial day
- **WHEN** a loan is at its due timestamp or less than 24 hours overdue
- **THEN** its fine is zero cents

#### Scenario: Completed overdue days
- **WHEN** a loan is 48 hours overdue
- **THEN** its fine is 50 cents

#### Scenario: Per-loan cap
- **WHEN** a loan is 41 or more completed days overdue
- **THEN** its fine is 1,000 cents

#### Scenario: Return freezes accrual
- **WHEN** a loan is returned 3 completed days overdue and the balance is checked later
- **THEN** that loan's fine remains 75 cents

### Requirement: Report current member balance
The service SHALL expose a member's unpaid fine balance in integer cents as the sum of accrued fines across their loans minus accepted payments. The balance SHALL reflect the current instant for open loans and SHALL never be negative. Unknown member IDs SHALL fail.

#### Scenario: Multiple loans and payments
- **WHEN** a member has accrued fines of 300 and 250 cents on separate loans and has paid 100 cents
- **THEN** the current unpaid balance is 450 cents

#### Scenario: Accrual after a payment
- **WHEN** a member pays their current balance while a loan remains open and another overdue day completes
- **THEN** the balance increases by 25 cents unless that loan has reached its cap

### Requirement: Accept fine payments
The service SHALL accept a payment for an existing member as a positive safe integer number of cents no greater than their current unpaid balance. Invalid amounts, overpayments, and unknown members SHALL fail without changing payment or suspension state.

#### Scenario: Partial and full payment
- **WHEN** a member pays a valid amount against their unpaid balance
- **THEN** the balance decreases by exactly that amount

#### Scenario: Invalid payment
- **WHEN** a payment is zero, negative, fractional, non-finite, unsafe, or exceeds the current balance
- **THEN** the payment fails without changing stored payments or suspension state

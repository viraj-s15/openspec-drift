# Spec Delta

## MODIFIED Requirements

### Requirement: Calculate overdue loan fines
The service SHALL calculate each loan's fine in integer cents as 25 times the number of completed 24-hour periods after its due timestamp, capped at 500 cents for premium members and 1,000 cents for standard members. Open loans accrue through the current instant; returned loans accrue only through their return timestamp. Within one service instance, earlier valid clock readings SHALL be treated as the last successfully observed instant.

#### Scenario: Due and partial day
- **WHEN** a loan is at its due timestamp or less than 24 hours overdue
- **THEN** its fine is zero cents

#### Scenario: Completed overdue days
- **WHEN** a loan is 48 hours overdue
- **THEN** its fine is 50 cents

#### Scenario: Per-loan cap
- **WHEN** a standard member's loan is 41 or more completed days overdue
- **THEN** its fine is 1,000 cents

#### Scenario: Premium cap boundary
- **WHEN** a premium member's loan is 19, 20, and then 21 completed days overdue
- **THEN** its fine is respectively 475, 500, and 500 cents

#### Scenario: Cap applies independently to each loan
- **WHEN** a premium member has two loans each at least 20 completed days overdue and has made no payments
- **THEN** their combined fine balance is 1,000 cents

#### Scenario: Return freezes accrual
- **WHEN** a loan is returned 3 completed days overdue and the balance is checked later
- **THEN** that loan's fine remains 75 cents

#### Scenario: Returned premium loan at cap
- **WHEN** a premium member returns a loan at least 20 completed days overdue and checks the balance later
- **THEN** that loan's fine remains 500 cents

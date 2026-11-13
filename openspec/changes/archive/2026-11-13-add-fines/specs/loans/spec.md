# Spec Delta

## MODIFIED Requirements

### Requirement: Enforce member eligibility
The service SHALL reject checkout for suspended members and members with five active loans. Checkout SHALL evaluate the member's current unpaid fines before deciding suspension. Returned loans SHALL not count toward this limit; a loan remains active until returned, even after its due date.

#### Scenario: Suspended member
- **WHEN** a suspended member attempts checkout
- **THEN** checkout fails without changing loans or copy status

#### Scenario: Active loan limit
- **WHEN** a member with five active loans attempts another checkout
- **THEN** checkout fails without changing loans or copy status

#### Scenario: Return frees capacity
- **WHEN** a member with five active loans returns one and checks out another available copy while otherwise eligible
- **THEN** the new checkout succeeds

#### Scenario: Overdue loans count
- **WHEN** a member has five unreturned loans whose due dates have passed and attempts another checkout
- **THEN** checkout fails

#### Scenario: Fines accrue before checkout
- **WHEN** a member's unpaid fines exceed 500 cents due to open loan accrual since their last operation and they attempt checkout
- **THEN** checkout fails without changing loans or copy status

### Requirement: Return an active loan
The service SHALL accept a return by copy ID for an active loan, end that loan, and mark the copy available. It SHALL retain the loan's due and return timestamps and member association for fine calculation. A suspended member's active loan SHALL still be returnable. Returning an unknown copy or a copy without an active loan SHALL fail without changing loans or copy status.

#### Scenario: Return and borrow again
- **WHEN** an active loan is returned and an eligible member checks out the same copy
- **THEN** the return makes the copy available and the later checkout creates a new active loan

#### Scenario: Suspended borrower returns
- **WHEN** a copy on an active loan to a member who has since been suspended is returned
- **THEN** the return succeeds and the copy becomes available

#### Scenario: Invalid or repeated return
- **WHEN** a return is requested for an unknown copy or a copy without an active loan
- **THEN** the return fails without changing loans or copy status

#### Scenario: Separate loans of the same copy
- **WHEN** a copy is returned overdue and subsequently borrowed and returned again
- **THEN** each loan's fine is calculated independently and retained against its borrower

# Spec Delta

## Purpose

Enable lending physical library copies to eligible members and returning them for future borrowing.

## ADDED Requirements

### Requirement: Check out an available copy
The service SHALL check out a copy identified by copy ID to a member identified by member ID, create an active loan recording both IDs and checkout and due timestamps, and mark the copy on loan. It SHALL reject unknown members, unknown copies, unavailable copies, and copies already associated with an active loan, without changing loans or copy status.

#### Scenario: Successful checkout
- **WHEN** an eligible member checks out an available copy with no active loan
- **THEN** an active loan is returned and the copy is marked on loan

#### Scenario: Invalid checkout target
- **WHEN** checkout specifies an unknown member, unknown copy, unavailable copy, or a copy already associated with an active loan
- **THEN** checkout fails without changing loans or copy status

### Requirement: Enforce member eligibility
The service SHALL reject checkout for suspended members and members with five active loans. Returned loans SHALL not count toward this limit; a loan remains active until returned, even after its due date.

#### Scenario: Suspended member
- **WHEN** a suspended member attempts checkout
- **THEN** checkout fails without changing loans or copy status

#### Scenario: Active loan limit
- **WHEN** a member with five active loans attempts another checkout
- **THEN** checkout fails without changing loans or copy status

#### Scenario: Return frees capacity
- **WHEN** a member with five active loans returns one and checks out another available copy
- **THEN** the new checkout succeeds

#### Scenario: Overdue loans count
- **WHEN** a member has five unreturned loans whose due dates have passed and attempts another checkout
- **THEN** checkout fails

### Requirement: Determine loan due date
The service SHALL use an injectable clock to timestamp checkout and calculate the due timestamp as exactly 14 days after checkout for a standard member and 28 days for a premium member, with each day equal to 24 hours.

#### Scenario: Tier duration
- **WHEN** a standard or premium member checks out a copy at a controlled instant
- **THEN** the returned loan's due timestamp is respectively 14 or 28 days after its checkout timestamp

### Requirement: Return an active loan
The service SHALL accept a return by copy ID for an active loan, end that loan, and mark the copy available. A suspended member's active loan SHALL still be returnable. Returning an unknown copy or a copy without an active loan SHALL fail without changing loans or copy status.

#### Scenario: Return and borrow again
- **WHEN** an active loan is returned and an eligible member checks out the same copy
- **THEN** the return makes the copy available and the later checkout creates a new active loan

#### Scenario: Suspended borrower returns
- **WHEN** a copy on an active loan to a member who has since been suspended is returned
- **THEN** the return succeeds and the copy becomes available

#### Scenario: Invalid or repeated return
- **WHEN** a return is requested for an unknown copy or a copy without an active loan
- **THEN** the return fails without changing loans or copy status

### Requirement: Protect loan records
Loan data returned to callers SHALL be detached from stored state, including mutable date values, so callers cannot change eligibility, timestamps, or copy associations by modifying a returned value.

#### Scenario: Mutate returned loan
- **WHEN** a caller changes a returned loan or its date values
- **THEN** the stored loan and later borrowing decisions remain unchanged

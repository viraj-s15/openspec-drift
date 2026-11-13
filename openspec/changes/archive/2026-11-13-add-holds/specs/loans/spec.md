# Spec Delta

## MODIFIED Requirements

### Requirement: Check out an available copy
The service SHALL check out a copy identified by copy ID to a member identified by member ID, create an active loan recording both IDs and checkout and due timestamps, and mark the copy on loan. A ready hold's reserved copy SHALL be eligible only for its holding member, and successful checkout SHALL consume that hold. It SHALL reject unknown members, unknown copies, unavailable copies other than the member's reservation, and copies already associated with an active loan, without changing loans or copy status beyond expiration processing.

#### Scenario: Successful checkout
- **WHEN** an eligible member checks out an available copy with no active loan
- **THEN** an active loan is returned and the copy is marked on loan

#### Scenario: Invalid checkout target
- **WHEN** checkout specifies an unknown member, unknown copy, unavailable copy not reserved for that member, or a copy already associated with an active loan
- **THEN** checkout fails without changing loans or copy status beyond expiration processing

#### Scenario: Reserved checkout
- **WHEN** the holding member checks out their ready copy while eligible
- **THEN** the hold is consumed and the copy is on loan to that member

#### Scenario: Reservation prevents another checkout
- **WHEN** another member attempts to check out a reserved copy
- **THEN** checkout fails and the reservation remains unchanged

#### Scenario: Reserved member is ineligible
- **WHEN** the holding member is suspended or at the active-loan limit and attempts checkout before expiration
- **THEN** checkout fails and the ready hold remains in place

### Requirement: Return an active loan
The service SHALL accept a return by copy ID for an active loan, end that loan, and reserve the copy for the next waiting hold if one exists or otherwise mark it available. It SHALL retain the loan's due and return timestamps and member association for fine calculation. A suspended member's active loan SHALL still be returnable. Returning an unknown copy or a copy without an active loan SHALL fail without changing loans or copy status beyond expiration processing.

#### Scenario: Return and borrow again
- **WHEN** an active loan is returned with no waiting hold and an eligible member checks out the same copy
- **THEN** the return makes the copy available and the later checkout creates a new active loan

#### Scenario: Suspended borrower returns
- **WHEN** a copy on an active loan to a member who has since been suspended is returned with no waiting hold
- **THEN** the return succeeds and the copy becomes available

#### Scenario: Invalid or repeated return
- **WHEN** a return is requested for an unknown copy or a copy without an active loan
- **THEN** the return fails without changing loans or copy status beyond expiration processing

#### Scenario: Separate loans of the same copy
- **WHEN** a copy is returned overdue and subsequently borrowed and returned again
- **THEN** each loan's fine is calculated independently and retained against its borrower

#### Scenario: Return with waiting hold
- **WHEN** a copy is returned while its book has a waiting hold
- **THEN** the loan ends and the copy is reserved for the first waiting member

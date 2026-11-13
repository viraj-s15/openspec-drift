# loans Specification

## Purpose

Enable lending physical library copies to eligible members and returning them for future borrowing.

## Requirements

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

### Requirement: Determine loan due date
The service SHALL use an injectable clock to timestamp checkout and calculate the due timestamp as exactly 14 days after checkout for a standard member and 28 days for a premium member, with each day equal to 24 hours.

#### Scenario: Tier duration
- **WHEN** a standard or premium member checks out a copy at a controlled instant
- **THEN** the returned loan's due timestamp is respectively 14 or 28 days after its checkout timestamp

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

### Requirement: Protect loan records
Loan data returned to callers SHALL be detached from stored state, including mutable date values, so callers cannot change eligibility, timestamps, or copy associations by modifying a returned value.

#### Scenario: Mutate returned loan
- **WHEN** a caller changes a returned loan or its date values
- **THEN** the stored loan and later borrowing decisions remain unchanged

### Requirement: Renew an active loan
The service SHALL allow a borrower to renew their active loan at most twice. A successful renewal SHALL set its due timestamp to the renewal timestamp plus the borrower's normal loan period: 14 days for standard and 28 days for premium members, with each day equal to 24 hours. The renewal timestamp SHALL use the service's injectable clock.

#### Scenario: Renew for either tier
- **WHEN** a standard or premium borrower renews an eligible loan at a controlled instant
- **THEN** its due timestamp is respectively 14 or 28 days after that instant, not the previous due timestamp

#### Scenario: Renewal limit and reset
- **WHEN** an eligible loan has been renewed twice and another renewal is requested
- **THEN** the request fails without changing the loan, and a later new loan of the same copy has its own two-renewal allowance

### Requirement: Reject ineligible renewals
The service SHALL reject a renewal unless the specified member owns an active loan for the copy, the loan is not overdue, fewer than two renewals have succeeded, and no other member has a waiting or unexpired ready hold for the same book. Rejection SHALL leave loan and copy state unchanged, except for hold expiration processing.

#### Scenario: Overdue boundary
- **WHEN** renewal is requested exactly at the due timestamp
- **THEN** the loan is not overdue and renewal succeeds if otherwise eligible

#### Scenario: After due timestamp
- **WHEN** renewal is requested after the due timestamp
- **THEN** renewal fails and the loan's due timestamp and renewal allowance remain unchanged

#### Scenario: Another member holds the book
- **WHEN** another member has a waiting or unexpired ready hold for the same ISBN, including a hold for a different copy
- **THEN** renewal fails without changing the loan or consuming the hold

#### Scenario: Own or expired hold
- **WHEN** the only holds for the book belong to the borrower or have expired and expiration processing assigns no hold to another member
- **THEN** those holds do not prevent an otherwise eligible renewal

#### Scenario: Invalid loan or borrower
- **WHEN** renewal specifies an unknown member or copy, a copy without an active loan, or a member other than the borrower
- **THEN** renewal fails without changing the loan or copy state beyond hold expiration processing

#### Scenario: Detached result
- **WHEN** a caller modifies a successful renewal's returned loan or its dates
- **THEN** the stored loan and subsequent renewal decisions remain unchanged

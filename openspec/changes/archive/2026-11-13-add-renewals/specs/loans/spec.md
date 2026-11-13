# Spec Delta

## ADDED Requirements

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

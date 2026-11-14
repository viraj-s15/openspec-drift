# Spec Delta

## MODIFIED Requirements

### Requirement: Determine loan due date
The service SHALL use an injectable clock to timestamp checkout and calculate the due timestamp as exactly 14 days after checkout for a standard member and 35 days for a premium member, with each day equal to 24 hours. Existing loan due timestamps SHALL NOT be extended retroactively.

#### Scenario: Tier duration
- **WHEN** a standard or premium member checks out a copy at a controlled instant
- **THEN** the returned loan's due timestamp is respectively 14 or 35 days after its checkout timestamp

#### Scenario: Existing premium loan
- **WHEN** a premium loan was checked out under the previous 28-day policy and has not been renewed
- **THEN** its previously recorded due timestamp remains unchanged

### Requirement: Renew an active loan
The service SHALL allow a borrower to renew their active loan at most twice. A successful renewal SHALL set its due timestamp to the renewal timestamp plus the borrower's normal loan period: 14 days for standard and 35 days for premium members, with each day equal to 24 hours. The renewal timestamp SHALL use the service's injectable clock.

#### Scenario: Renew for either tier
- **WHEN** a standard or premium borrower renews an eligible loan at a controlled instant
- **THEN** its due timestamp is respectively 14 or 35 days after that instant, not the previous due timestamp

#### Scenario: Renewal limit and reset
- **WHEN** an eligible loan has been renewed twice and another renewal is requested
- **THEN** the request fails without changing the loan, and a later new loan of the same copy has its own two-renewal allowance

#### Scenario: Renew a previously issued premium loan
- **WHEN** a premium loan issued under the previous 28-day policy is successfully renewed
- **THEN** its due timestamp becomes 35 days after the renewal timestamp

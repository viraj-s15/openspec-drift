# Spec Delta

## MODIFIED Requirements

### Requirement: Renew an active loan
The service SHALL allow a borrower to renew their active loan at most twice. A successful renewal SHALL set its due timestamp to the current due timestamp plus the borrower's normal loan period: 14 days for standard and 28 days for premium members, with each day equal to 24 hours. The service SHALL use its injectable clock to determine renewal eligibility.

#### Scenario: Renew for either tier
- **WHEN** a standard or premium borrower renews an eligible loan before its due timestamp
- **THEN** its new due timestamp is respectively 14 or 28 days after its previous due timestamp, regardless of the renewal instant

#### Scenario: Consecutive early renewals
- **WHEN** an eligible borrower renews the same loan twice before its original due timestamp
- **THEN** each renewal adds a full normal loan period to the due timestamp resulting from the previous checkout or renewal

#### Scenario: Renewal limit and reset
- **WHEN** an eligible loan has been renewed twice and another renewal is requested
- **THEN** the request fails without changing the loan, and a later new loan of the same copy has its own two-renewal allowance

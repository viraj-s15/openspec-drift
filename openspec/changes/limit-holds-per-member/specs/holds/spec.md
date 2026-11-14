# Spec Delta

## ADDED Requirements

### Requirement: Limit active holds per member
The service SHALL allow each member at most three active holds across all books. Waiting and ready holds both count. It SHALL reject a new hold if the member already has three or more active holds after expiration processing, without changing holds or copies beyond that processing.

#### Scenario: Allow up to three active holds
- **WHEN** a member with two active holds places an otherwise eligible hold on another book
- **THEN** the hold is accepted and the member has three active holds

#### Scenario: Reject a fourth active hold
- **WHEN** a member with three active holds places an otherwise eligible hold on another book
- **THEN** the request fails and no hold or copy state changes beyond expiration processing

#### Scenario: Count waiting and ready holds together
- **WHEN** a member has a mixture of waiting and ready holds totaling three and attempts another otherwise eligible hold
- **THEN** the request fails, regardless of which books contain those holds

#### Scenario: Other members have independent limits
- **WHEN** one member has three active holds and another member with fewer than three places an otherwise eligible hold
- **THEN** the other member's hold is accepted

#### Scenario: Expiration frees capacity before placement
- **WHEN** a member has three active holds including a ready hold at its expiration deadline and places an otherwise eligible hold on another book
- **THEN** expiration is processed first and the new hold is accepted

#### Scenario: Pickup frees capacity
- **WHEN** a member with three active holds successfully checks out the copy reserved by one of their ready holds and then places an otherwise eligible hold
- **THEN** the consumed hold no longer counts and the new hold is accepted

#### Scenario: Allocation does not free capacity
- **WHEN** a member's waiting hold becomes ready and the member has three active holds in total
- **THEN** a fourth hold request fails because the ready hold still counts

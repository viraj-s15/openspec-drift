# Spec Delta

## MODIFIED Requirements

### Requirement: Manage suspension status
The registry SHALL allow an existing member to be manually suspended and reinstated, without altering their ID, name, or tier. A member SHALL be suspended when manually suspended or when their current unpaid fine balance exceeds 500 cents. A payment reducing that balance to 500 cents or less SHALL remove the fine-related suspension but SHALL NOT remove an independent manual suspension. Repeating a manual operation for the current manual status SHALL succeed without changing the record. Status changes for unknown IDs SHALL fail without changing the registry.

#### Scenario: Suspend and reinstate
- **WHEN** an active member without a fine-related suspension is suspended and then reinstated
- **THEN** the member is suspended after the first operation and active after the second, with other fields unchanged

#### Scenario: Repeat status operation
- **WHEN** an already manually suspended member is suspended or a member without a manual suspension is reinstated
- **THEN** the operation succeeds and their manual status remains unchanged

#### Scenario: Unknown member status update
- **WHEN** suspension or reinstatement is requested for an unknown ID
- **THEN** the operation fails and the registry remains unchanged

#### Scenario: Fine threshold
- **WHEN** an active member's current unpaid balance rises from 500 cents to 525 cents
- **THEN** the member is suspended automatically

#### Scenario: Payment reinstates fine-suspended member
- **WHEN** a member suspended only for fines pays their balance down to 500 cents
- **THEN** the member is active again

#### Scenario: Manual suspension remains independent
- **WHEN** a manually suspended member pays their fines down to 500 cents or less
- **THEN** the member remains suspended until manually reinstated

#### Scenario: Manual reinstatement cannot override fines
- **WHEN** a member with unpaid fines exceeding 500 cents is manually reinstated
- **THEN** the member remains suspended for fines

### Requirement: Retrieve members
The registry SHALL support lookup by exact ID and listing all registered members, regardless of status. Returned members SHALL be detached snapshots that cannot modify stored records. Their suspension status SHALL reflect current unpaid fines as well as manual suspension at the time of retrieval.

#### Scenario: Look up a member
- **WHEN** an existing ID is looked up
- **THEN** its member record, including tier and current status, is returned

#### Scenario: Look up an unknown member
- **WHEN** an unknown ID is looked up
- **THEN** no member is returned

#### Scenario: List members
- **WHEN** members are listed
- **THEN** all registered members are returned once each in registration order, including suspended members

#### Scenario: List an empty registry
- **WHEN** members are listed before any registration
- **THEN** an empty list is returned

#### Scenario: Mutate a returned record
- **WHEN** a caller changes a member returned by lookup or listing
- **THEN** the stored member remains unchanged

#### Scenario: Time-dependent status on lookup
- **WHEN** an open loan accrues enough fines to raise a member's unpaid balance above 500 cents without another operation
- **THEN** the next lookup or listing reports that member as suspended

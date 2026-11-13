# members Specification

## Purpose

Provide an in-memory registry of library members and their current membership status.

## Requirements

### Requirement: Register members
The registry SHALL register members by unique string ID with a name, a tier of `standard` or `premium`, and an initially active status. It SHALL reject duplicate IDs and unsupported tiers without changing the registry.

#### Scenario: Register either tier
- **WHEN** a member is registered with a unique ID, name, and either supported tier
- **THEN** the member is stored with those values and active status

#### Scenario: Reject duplicate ID
- **WHEN** a member is registered with an existing ID
- **THEN** registration fails and the existing member remains unchanged

#### Scenario: Reject unsupported tier
- **WHEN** registration is attempted with a tier other than `standard` or `premium`
- **THEN** registration fails and no member is added

### Requirement: Retrieve members
The registry SHALL support lookup by exact ID and listing all registered members, regardless of status. Returned members SHALL be detached snapshots that cannot modify stored records.

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

### Requirement: Manage suspension status
The registry SHALL allow an existing member to be suspended and reinstated, without altering their ID, name, or tier. Repeating an operation for the current status SHALL succeed without changing the record. Status changes for unknown IDs SHALL fail without changing the registry.

#### Scenario: Suspend and reinstate
- **WHEN** an active member is suspended and then reinstated
- **THEN** the member is suspended after the first operation and active after the second, with other fields unchanged

#### Scenario: Repeat status operation
- **WHEN** an already suspended member is suspended or an active member is reinstated
- **THEN** the operation succeeds and the member remains unchanged

#### Scenario: Unknown member status update
- **WHEN** suspension or reinstatement is requested for an unknown ID
- **THEN** the operation fails and the registry remains unchanged

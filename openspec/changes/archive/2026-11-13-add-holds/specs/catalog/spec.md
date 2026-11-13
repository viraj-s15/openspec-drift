# Spec Delta

## MODIFIED Requirements

### Requirement: Track copy availability
The catalog SHALL allow each existing copy to be marked available, on loan, or reserved independently of other copies. Reserved copies SHALL NOT be reported as available.

#### Scenario: Update a copy status
- **WHEN** a copy is marked on loan and then available
- **THEN** its status reflects each update and other copies remain unchanged

#### Scenario: Reserved copy status
- **WHEN** a copy is reserved for a ready hold
- **THEN** catalog reads report its status as reserved until a lending or hold operation processes a change

#### Scenario: Unknown copy
- **WHEN** the status of an unknown copy is updated
- **THEN** the catalog rejects the update

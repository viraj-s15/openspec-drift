# Spec Delta

## MODIFIED Requirements

### Requirement: Allocate a returned copy
When a copy is returned and its book has waiting holds, the service SHALL remove the earliest waiting hold, mark it ready, and reserve that copy for its member until exactly 120 hours after allocation. Multiple returned copies SHALL satisfy successive waiting holds independently.

#### Scenario: Multiple returns
- **WHEN** two copies of a book are returned while two members are waiting
- **THEN** the first returned copy is reserved for the first member and the second for the second member

#### Scenario: Five-day pickup window
- **WHEN** a returned copy is allocated to a waiting hold
- **THEN** the ready hold expires exactly 120 hours after allocation

### Requirement: Expire ready holds
A ready hold SHALL expire at its deadline. On the next checkout, return, or hold operation, the service SHALL process expired holds before evaluating the operation, releasing each copy to the earliest waiting hold for that book with a new 120-hour period starting at processing time, or making it available if none waits. Catalog-only reads SHALL NOT trigger expiration.

#### Scenario: Deadline and reassignment
- **WHEN** a hold operation occurs exactly at or after a ready hold's deadline and another member is waiting
- **THEN** the expired hold is removed and the same copy is reserved for that member for 120 hours from processing

#### Scenario: No next member
- **WHEN** an expired reservation is processed with nobody waiting
- **THEN** its hold is removed and its copy becomes available

#### Scenario: Before deadline
- **WHEN** an operation occurs before the deadline
- **THEN** the reservation remains ready for its member

#### Scenario: Processing after the deadline
- **WHEN** an expired hold is processed after its deadline and another member is waiting
- **THEN** the new reservation expires 120 hours after processing, not after the previous deadline

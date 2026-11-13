# holds Specification

## Purpose

Enable members to queue for unavailable books and receive time-limited reservations on returned copies.

## Requirements

### Requirement: Place holds in order
The service SHALL accept a hold by member ID and ISBN only for an existing member and book with no available copy, and SHALL enqueue holds in placement order per book. A member SHALL have at most one waiting or ready hold per book. Rejected requests SHALL not change hold or copy state beyond expiration processing.

#### Scenario: Queue holds
- **WHEN** two different members place holds in sequence on the same book with no available copy
- **THEN** the first member precedes the second in that book's waiting queue

#### Scenario: Reject hold
- **WHEN** a hold references an unknown member or book, duplicates that member's active hold for the book, or any copy is available
- **THEN** the request fails without changing holds or copies beyond expiration processing

### Requirement: Allocate a returned copy
When a copy is returned and its book has waiting holds, the service SHALL remove the earliest waiting hold, mark it ready, and reserve that copy for its member until exactly 72 hours after allocation. Multiple returned copies SHALL satisfy successive waiting holds independently.

#### Scenario: Multiple returns
- **WHEN** two copies of a book are returned while two members are waiting
- **THEN** the first returned copy is reserved for the first member and the second for the second member

### Requirement: Expire ready holds
A ready hold SHALL expire at its deadline. On the next checkout, return, or hold operation, the service SHALL process expired holds before evaluating the operation, releasing each copy to the earliest waiting hold for that book with a new 72-hour period starting at processing time, or making it available if none waits. Catalog-only reads SHALL NOT trigger expiration.

#### Scenario: Deadline and reassignment
- **WHEN** a hold operation occurs exactly at or after a ready hold's deadline and another member is waiting
- **THEN** the expired hold is removed and the same copy is reserved for that member for 72 hours from processing

#### Scenario: No next member
- **WHEN** an expired reservation is processed with nobody waiting
- **THEN** its hold is removed and its copy becomes available

#### Scenario: Before deadline
- **WHEN** an operation occurs before the deadline
- **THEN** the reservation remains ready for its member

### Requirement: Inspect active holds
The service SHALL expose active holds for a book in queue order, including ready or waiting state, member, and for ready holds the reserved copy and expiration instant. Returned hold data and dates SHALL be detached from stored state.

#### Scenario: Inspect and mutate snapshots
- **WHEN** a caller inspects holds then changes the returned records or expiration dates
- **THEN** later inspections and reservation decisions are unchanged

#### Scenario: Unknown book
- **WHEN** holds are requested for an unknown book
- **THEN** the request fails

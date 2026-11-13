# Notification Spec Delta

## Purpose

Make loan deadlines and newly ready holds visible to library members through an in-memory outbox.

## ADDED Requirements

### Requirement: Inspect notification outbox
The service SHALL retain notifications in an in-memory outbox in emission order and expose detached snapshots. Each message SHALL identify its type and recipient; loan notices SHALL identify the copy and due timestamp, and hold-ready notices SHALL identify the ISBN, reserved copy, and expiration timestamp.

#### Scenario: Protect outbox state
- **WHEN** a caller modifies an outbox snapshot or a date within it
- **THEN** later snapshots and notification deduplication remain unchanged

### Requirement: Scan loan deadlines
The service SHALL accept a valid date to scan current active loans, comparing UTC calendar dates. It SHALL emit a due-soon notice exactly two calendar days before the current due date and an overdue notice exactly one calendar day after it. The scan SHALL NOT backfill dates missed by earlier scans or change loan or hold state.

#### Scenario: Exact calendar days
- **WHEN** a scan's UTC date is two days before an active loan's due UTC date, regardless of time of day
- **THEN** the outbox gains a due-soon notice for that loan

#### Scenario: Overdue and other days
- **WHEN** an active loan is scanned one UTC calendar day after its due date
- **THEN** the outbox gains an overdue notice; scans on the due date or later than the next day do not produce a notice for that date

#### Scenario: Returned loan
- **WHEN** a loan has been returned before a scan for an otherwise eligible date
- **THEN** no loan notice is emitted for that returned loan

#### Scenario: Invalid scan date
- **WHEN** the scan receives an invalid Date
- **THEN** it fails without changing the outbox or deduplication state

### Requirement: Deduplicate loan notices
The service SHALL emit at most one loan notice per notice type, individual loan, and due timestamp, regardless of repeated or out-of-order scans. Renewal SHALL use the new due timestamp for eligibility and deduplication; a later loan of the same copy SHALL have an independent notice history.

#### Scenario: Repeated scan
- **WHEN** an eligible loan is scanned repeatedly for the same notice date, including after a scan of another date
- **THEN** only one notice of that type exists for that loan and due timestamp

#### Scenario: Renewal changes due date
- **WHEN** an active loan is renewed to a different due timestamp after a due-soon notice and later scanned two days before its new due date
- **THEN** one new due-soon notice is emitted for the new due timestamp

#### Scenario: Copy borrowed again
- **WHEN** a copy is returned and borrowed in a new loan, and that loan is scanned on its notice date
- **THEN** the previous loan's notice history does not suppress the new notice

### Requirement: Notify when a hold becomes ready
The service SHALL append one hold-ready notice when a waiting hold becomes ready and a copy is reserved, whether allocation follows a return or expiration processing. Merely placing or inspecting a waiting hold SHALL NOT itself emit a notice.

#### Scenario: Return allocates a hold
- **WHEN** a return reserves a copy for the next waiting hold
- **THEN** one hold-ready notice for that member and reservation is appended

#### Scenario: Expiration reassigns a copy
- **WHEN** expiration processing reserves a released copy for another waiting member
- **THEN** one hold-ready notice is appended for the new reservation, including when the initiating operation later fails

#### Scenario: No allocation
- **WHEN** a hold remains waiting or an expired reservation releases a copy with no waiting member
- **THEN** no hold-ready notice is emitted for that event

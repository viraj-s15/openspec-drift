# Catalog Spec Delta

## Purpose

The catalog enables discovery of books and tracks the availability of their physical copies.

## ADDED Requirements

### Requirement: Catalog books
The catalog SHALL store books by unique ISBN with a title, author, and at least one uniquely identified physical copy. New copies SHALL start available.

#### Scenario: Add a book
- **WHEN** a book is added with an ISBN, title, author, and one or more copy IDs
- **THEN** the catalog stores the book and all copies as available

#### Scenario: Reject duplicate ISBN
- **WHEN** a book is added with an ISBN already in the catalog
- **THEN** the catalog rejects it without changing the existing book

#### Scenario: Reject a book without copies
- **WHEN** a book is added with no copies
- **THEN** the catalog rejects it

#### Scenario: Reject duplicate copy IDs
- **WHEN** a book is added with a copy ID already used in the catalog or repeated in the request
- **THEN** the catalog rejects it without changing the catalog

### Requirement: Track copy availability
The catalog SHALL allow each existing copy to be marked available or on loan independently of other copies.

#### Scenario: Update a copy status
- **WHEN** a copy is marked on loan and then available
- **THEN** its status reflects each update and other copies remain unchanged

#### Scenario: Unknown copy
- **WHEN** the status of an unknown copy is updated
- **THEN** the catalog rejects the update

### Requirement: Search catalog
The catalog SHALL return books whose title or author contains the search query as a case-insensitive substring, regardless of copy availability.

#### Scenario: Search title
- **WHEN** a query matches part of a title ignoring case
- **THEN** the matching book is returned

#### Scenario: Search author
- **WHEN** a query matches part of an author ignoring case
- **THEN** the matching book is returned

#### Scenario: Search without a match
- **WHEN** a query matches neither title nor author of any book
- **THEN** no books are returned

#### Scenario: Empty query
- **WHEN** the query is empty
- **THEN** all books are returned once each

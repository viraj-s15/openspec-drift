#!/usr/bin/env bash
# Builds the eight baseline changes in order. Each one stops the run if its checks, tests or typecheck fail.
# The published baseline built add-catalog with an earlier one-call version of baseline-change.sh.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .sessions
run() { scripts/baseline-change.sh "$1" "$2" > ".sessions/$1.out" 2>&1 && echo "done $1" || { echo "FAILED $1: $(tail -1 ".sessions/$1.out")"; exit 1; }; }
run add-catalog "Books with ISBN, title and author. Each book has one or more physical copies, each available or on loan. Search books by title or author, case-insensitive substring match."
run add-members "Members with an id, name and tier: standard or premium. A member can be suspended and reinstated. Register, look up and list members."
run add-loans "Check out an available copy to a member and return it. A loan lasts 14 days for standard members and 28 days for premium members. A member may have at most 5 active loans. Suspended members cannot borrow. Use an injectable clock so tests control dates."
run add-fines "A returned or still-open overdue loan accrues a late fee of 0.25 dollars per day, capped at 10.00 dollars per loan. Members can pay fines. When a member's unpaid fines exceed 5.00 dollars they are suspended automatically; paying down to 5.00 or less reinstates them. Store money as integer cents. This modifies the members spec too."
run add-holds "A member can place a hold on a book with no available copy. Holds form a first-come queue per book. When a copy is returned, the first hold becomes ready and the copy is reserved for that member. A ready hold expires after 3 days and passes to the next member in the queue."
run add-renewals "A member can renew an active loan up to 2 times. Each renewal extends the due date by the member's normal loan period counted from the renewal date. A loan cannot be renewed when another member holds the book, or when it is overdue. This modifies the loans spec."
run add-notifications "Send messages to an in-memory outbox: a due-soon notice 2 days before a loan is due, an overdue notice the day after it is due, and a hold-ready notice when a hold becomes ready. A function scans for due-soon and overdue loans on a given date and never sends the same notice twice."
run premium-fine-cap "Premium members get a lower fine cap of 5.00 dollars per loan. Standard members keep 10.00. This modifies the fines spec."
echo ALL_DONE

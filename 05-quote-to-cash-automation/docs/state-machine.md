# State machine

The quote path is `draft -> pending_approval -> approved -> sent -> accepted -> invoiced`. Rejected, expired, and void are terminal. Invoice states are open/invoiced, partially paid, paid, overdue, written off, and refunded with bounded transitions. Every sensitive transition requires an actor or provider identity. An accepted quote version is not edited; a commercial change creates a new version and new acceptance.

# Implementation Plan: Enhance donation recording with Monad network verification and robust alert delivery

## Phase 1: Verification Logic
- [x] Task: Database Schema Update (f2ce764)
- [x] Task: Implement Monad RPC verification utility (a4fb7f2)
    - [ ] Create a utility in `web/src/lib/monad-utils.ts` to check transaction status using `viem`.
    - [ ] Add unit tests for the verification utility.
- [ ] Task: Integrate verification into `record.ts` API
    - [ ] Update `web/src/routes/api/donation/record.ts` to call the verification utility.
    - [ ] Update database schema if needed to track transaction state.
    - [ ] Write integration tests for the `record` endpoint.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Verification Logic' (Protocol in workflow.md)

## Phase 2: Robust Alerts
- [ ] Task: Refactor Ably publishing logic
    - [ ] Move Ably publishing to a central utility in `web/src/lib/ably-utils.ts`.
    - [ ] Implement error handling and logging for publication failures.
- [ ] Task: Update Overlays for Reliability
    - [ ] Add basic reconnection logic or status indicators to the widget page in `$type.$address.tsx`.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Robust Alerts' (Protocol in workflow.md)

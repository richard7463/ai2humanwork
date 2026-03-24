# ai2human

`ai2human` is human fallback infrastructure for agents on X Layer.

When an agent gets blocked by a storefront check, signature, pickup, or in-person confirmation, ai2human dispatches a human operator, collects structured proof, verifies completion, and settles on X Layer.

Core loop:

`task -> human execution -> proof -> verify -> settle`

## Why This Project Exists

Agents can already do a large amount of online work. They still break when a workflow reaches the physical world. Most products handle that last mile with off-platform messages, screenshots, and manual payouts.

ai2human brings that last mile back into one auditable system:

- a blocked task is dispatched
- a human operator executes the real-world step
- structured proof is submitted
- verification clears the result
- settlement is released only after approval

## Proven X Layer Settlement

The submission includes a real X Layer mainnet settlement:

- `txHash`: `0x9c01ad8dac5f2fa1d77da8e9b3f2a3afbfe539ea68af7f3929d7bf9a5f3f5d67`
- Explorer: [OKLink transaction](https://www.oklink.com/xlayer/tx/0x9c01ad8dac5f2fa1d77da8e9b3f2a3afbfe539ea68af7f3929d7bf9a5f3f5d67)
- Settled asset: `USDT0 / USD₮0`
- Settled task: `Reply to the official thread with a localized summary and CTA`
- Proof post: [X reply proof](https://x.com/Richard_buildai/status/2036393335326380458)

This proves the end-to-end loop onchain:

`task -> proof -> verify -> settle on X Layer`

## What To Open

- Submission surface: `/submission`
- Live demo: `/livedemo`
- Reviewer console: `/reviewer`
- Task board: `/tasks`
- Settled task proof page: `/tasks/7bde6365-9e4a-4fa9-a2f4-e79657b354b3`

## Real-World Task Types

- storefront open / closed verification
- shelf and product availability checks
- front-desk signature pickup
- locker or counter pickup confirmation
- menu and live price verification
- venue queue and entrance-status checks

## x402 Note

The product also includes an x402-gated verification bundle flow as a bonus proof-access layer. For this submission, the primary proof centers on the real task settlement transaction above.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000/submission](http://localhost:3000/submission) to view the submission proof surface locally.

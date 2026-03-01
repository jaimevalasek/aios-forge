# Engineering Notes

Date: 2026-03-01

## What was added in this iteration
- Web3 framework detection was added:
  - Ethereum: `Hardhat`, `Foundry`, `Truffle`
  - Solana: `Anchor`, `Solana Web3`
  - Cardano: `Cardano` (Aiken/Cardano SDK signals)
- Context contract extended:
  - `project_type` now supports `dapp`
  - `project.context.md` now includes Web3 frontmatter/body fields (`web3_enabled`, `web3_networks`, `contract_framework`, `wallet_provider`, `indexer`, `rpc_provider`)
- `setup:context` now infers `dapp` defaults from Web3 framework detection.
- New Web3 skills shipped in template:
  - static: chain patterns + security checklist + Node/TypeScript patterns
  - dynamic: Ethereum/Solana/Cardano docs references
- New guide: `docs/en/web3.md`.
- Development baseline bumped to `0.1.5`.

## Why this matters
- Makes AIOS Lite viable for the growing JS/TS Web3 developer segment.
- Reduces setup ambiguity by encoding chain/framework decisions into structured context.
- Keeps lightweight scope: guidance and detection first, no risky auto-deployment behavior.

## Known limitations
- Agent execution is still manual from the AI CLI perspective; this package does not spawn external AI sessions.
- Locale pack coverage is currently limited to `en` and `pt-BR`.
- Web3 detection is heuristic-based and may require manual override in monorepos.

## Next implementation targets
1. Add chain-specific smoke variants (`--web3=ethereum|solana|cardano`).
2. Expand locale packs beyond `en` and `pt-BR` (for example `es`, `fr`) with contribution workflow.
3. Add optional machine-readable output mode (`--json`) for CI consumption.

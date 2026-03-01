# Web3 Ethereum Patterns

- Use battle-tested tooling (`Hardhat` or `Foundry`) and pin compiler versions.
- Keep contracts upgrade strategy explicit (proxy or immutable) before coding.
- Use role-based access controls and event emissions for every critical action.
- Add gas usage checks for hot paths and avoid unbounded loops.

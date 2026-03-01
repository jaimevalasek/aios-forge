# Web3 Security Checklist

- Threat model: admin keys, signer compromise, replay, oracle manipulation.
- Validate authorization for every state-changing entrypoint.
- Add invariant tests for balances, supply, and permission boundaries.
- Require independent review before mainnet deployment.
- Freeze deployment metadata (network IDs, addresses, ABI/IDL hashes) in release notes.

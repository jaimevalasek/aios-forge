# Suporte Web3

> Como usar o AIOS Lite para projetos de blockchain e contratos inteligentes.

---

## Frameworks detectados automaticamente

O AIOS Lite detecta sua stack Web3 ao rodar `setup:context` ou `doctor`:

| Chain | Frameworks detectados |
|---|---|
| Ethereum | Hardhat, Foundry, Truffle |
| Solana | Anchor, Solana Web3.js |
| Cardano | Aiken, Cardano SDK |

---

## Configurando um projeto dApp

### Setup interativo

```bash
npx aios-lite setup:context
```

Responda `dapp` quando perguntado sobre o tipo de projeto.

### Setup com flags (recomendado para automação)

**Ethereum com Hardhat:**
```bash
npx aios-lite setup:context . --defaults \
  --project-name="Meu DApp" \
  --project-type=dapp \
  --framework=Hardhat \
  --framework-installed=true \
  --classification=MEDIUM \
  --web3-enabled=true \
  --web3-networks=ethereum \
  --contract-framework=Hardhat \
  --wallet-provider=wagmi \
  --rpc-provider=Alchemy \
  --lang=pt-BR
```

**Solana com Anchor:**
```bash
npx aios-lite setup:context . --defaults \
  --project-name="Meu Programa Solana" \
  --project-type=dapp \
  --framework=Anchor \
  --framework-installed=true \
  --classification=SMALL \
  --web3-enabled=true \
  --web3-networks=solana \
  --contract-framework=Anchor \
  --wallet-provider=Phantom \
  --lang=pt-BR
```

**Cardano com Aiken:**
```bash
npx aios-lite setup:context . --defaults \
  --project-name="Meu Contrato Cardano" \
  --project-type=dapp \
  --framework=Cardano \
  --framework-installed=true \
  --classification=SMALL \
  --web3-enabled=true \
  --web3-networks=cardano \
  --contract-framework=Aiken \
  --lang=pt-BR
```

---

## Monorepo: contratos + frontend no mesmo repositório

Se você tem contratos inteligentes E um frontend no mesmo repositório (exemplo comum: Hardhat na raiz + Next.js em `/frontend`), o AIOS Lite detecta isso automaticamente como **monorepo** e exibe um aviso:

```
⚠ Monorepo detectado: framework Web3 (Hardhat) e framework de aplicação (Next.js)
  coexistem no mesmo diretório. Configure os caminhos de build separadamente.
```

**Estrutura recomendada para monorepo Ethereum:**
```
meu-dapp/
  contracts/         ← Solidity
  scripts/           ← deploy
  test/              ← testes de contrato
  frontend/          ← Next.js
    src/
      hooks/         ← wagmi hooks
      lib/
        contracts.ts ← ABIs e endereços deployados
  hardhat.config.js
  package.json
  .aios-lite/        ← contexto AIOS Lite
```

---

## Agentes em projetos Web3

### @analyst — o que mapear

Para dApps, o @analyst vai focar em:
- **Atores on-chain vs off-chain:** quem chama qual função do contrato?
- **Entidades do contrato:** structs, mappings, events
- **Regras de negócio críticas:** limites, access control, tokenomics
- **Riscos de segurança:** reentrancy, overflow, front-running, flash loans

**Exemplo de saída para um protocolo DeFi:**
```markdown
## Atores
- Liquidity Provider: deposita tokens no pool
- Trader: faz swaps pagando fee
- Protocol Admin: pode pausar e atualizar parâmetros

## Entidades on-chain
| Entidade  | Tipo         | Notas                        |
|-----------|--------------|------------------------------|
| Pool      | struct       | tokenA, tokenB, reservas     |
| Position  | mapping      | LP → liquidez provida        |
| Swap      | event        | amountIn, amountOut, fee     |

## Riscos identificados
- Flash loan attack no cálculo de preço
- Reentrancy em withdraw de liquidez
- Front-running em transações de swap grandes
```

### @architect — estrutura para cada chain

**Ethereum (Hardhat):**
```
contracts/
  core/
    Protocol.sol
    interfaces/IProtocol.sol
  utils/
    Math.sol
  mocks/
    MockToken.sol  ← apenas para testes
scripts/
  deploy/
    01_deploy_protocol.js
test/
  Protocol.test.js
frontend/ (se monorepo)
```

**Solana (Anchor):**
```
programs/
  meu-programa/
    src/
      lib.rs
      instructions/
        initialize.rs
        deposit.rs
      state/
        pool.rs
      errors.rs
tests/
  meu-programa.ts
app/ (se monorepo)
```

**Cardano (Aiken):**
```
lib/
  validators/
    minting.ak
    spending.ak
  utils/
    math.ak
validators/
  main.ak
scripts/
  deploy.sh
```

### @dev — convenções Web3

O @dev segue estas regras para contratos:

**Sempre:**
- `ReentrancyGuard` do OpenZeppelin em funções de pagamento
- Withdraw pattern (pull) em vez de push para pagamentos
- `require` com mensagens descritivas
- Events para todas as ações de estado relevante
- Testes em fork da mainnet para integrações DeFi

**Nunca:**
- Usar `transfer()` ou `send()` diretamente em funções públicas
- Armazenar dados sensíveis on-chain sem criptografia
- Fazer cálculos com divisão antes de multiplicação (perda de precisão)
- Confiar em `block.timestamp` para lógica crítica

### @qa — auditoria de contratos

O @qa em projetos Web3 vai além de testes funcionais:

```
/qa

Audite os contratos para:
- Reentrancy (todas as funções externas que modificam estado)
- Integer overflow/underflow (pré-0.8.0 ou operações unchecked)
- Access control (funções admin protegidas?)
- Oracle manipulation
- Eventos emitidos corretamente
Escreva testes Hardhat/Foundry com cenários de ataque.
```

---

## Smoke tests Web3

Valide sua configuração de dApp:

```bash
# Verificar configuração Ethereum
npx aios-lite test:smoke --web3=ethereum

# Verificar configuração Solana
npx aios-lite test:smoke --web3=solana

# Verificar configuração Cardano
npx aios-lite test:smoke --web3=cardano

# Monorepo Web3 + frontend
npx aios-lite test:smoke --profile=mixed
```

---

## Skills incluídas nos templates

Após instalar, você tem acesso a skills estáticas de referência:

| Skill | Conteúdo |
|---|---|
| `web3-ethereum-patterns` | Padrões Solidity, ERC standards, gas optimization |
| `web3-solana-patterns` | Padrões Rust/Anchor, PDAs, Cross-program invocations |
| `web3-cardano-patterns` | Aiken, UTxO model, datum/redeemer patterns |
| `web3-security-checklist` | Checklist completo de auditoria de contratos |
| `node-typescript-patterns` | Padrões TypeScript para scripts e frontend Web3 |

Para usar uma skill, referencie no seu AI IDE:
```
/dev Usando a skill web3-security-checklist, audite nosso contrato.
```

---

## Veja também

- [Cenários completos: exemplo de dApp Ethereum](./cenarios.md#cenário-4--dapp-ethereum-medium)
- [Início rápido](./inicio-rapido.md)
- [Guia de agentes](./agentes.md)

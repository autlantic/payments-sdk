<p align="center">
  <img src="https://autlantic.com/brand/autlantic-icon-1024-master.png" alt="Autlantic" width="72" height="72" />
</p>

<h1 align="center">@autlantic/chain-evm</h1>

<p align="center">
  Base network helpers for Autlantic USDC billing (recurring vault + one-time UsdcPass).
</p>

<p align="center">
  <a href="https://docs.autlantic.com"><img src="https://img.shields.io/badge/docs-docs.autlantic.com-5672cd?style=flat-square" alt="Docs" /></a>
  <a href="https://www.npmjs.com/package/@autlantic/chain-evm"><img src="https://img.shields.io/npm/v/@autlantic/chain-evm?style=flat-square&color=5672cd" alt="npm" /></a>
  <a href="https://github.com/autlantic/payments-sdk/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT" /></a>
</p>

---

Addresses, amount conversion, allowance/vault calldata, **UsdcPass** transfer verification, and relayer helpers used by the Autlantic Billing stack. Relayer helpers are for gas sponsorship and transaction submission; they are not used to custody USDC balances.

## Install

```bash
npm install @autlantic/chain-evm
```

Most integrators only need [`@autlantic/payments-recurring`](https://www.npmjs.com/package/@autlantic/payments-recurring). Use this package directly when you need lower-level Base / USDC utilities.

## UsdcPass (one-time transfer)

For a single USDC payment (no vault mandate):

```ts
import {
  chainConfigFor,
  encodeTransferCalldata,
  usdcToMicro,
  verifyUsdcPassPaymentFromTxHash,
  type UsdcPassPaymentIntent,
} from "@autlantic/chain-evm";

const chainId = 84532; // Base Sepolia
const chain = chainConfigFor(chainId);
const payoutAddress = "0x…";
const amountUsdc = 49;

const intent: UsdcPassPaymentIntent = {
  chainId,
  usdcAddress: chain.usdcAddress,
  payoutAddress,
  expectedAmountUsdc: amountUsdc,
};

const transferCalldata = encodeTransferCalldata(payoutAddress, usdcToMicro(amountUsdc));
// Wallet sends { to: usdcAddress, data: transferCalldata }, then:
const result = await verifyUsdcPassPaymentFromTxHash(intent, txHash);
```

Hosted Autlantic checkout (`POST /v1/payments` → `/checkout/pay/:id`) uses the same verification path. See [One-time payments](https://docs.autlantic.com/guide/one-time-payments).

## Docs

- Product: [autlantic.com](https://autlantic.com)
- Docs: [docs.autlantic.com](https://docs.autlantic.com)
- Source: [github.com/autlantic/payments-sdk](https://github.com/autlantic/payments-sdk)

## License

[MIT](https://github.com/autlantic/payments-sdk/blob/main/LICENSE) © Autlantic

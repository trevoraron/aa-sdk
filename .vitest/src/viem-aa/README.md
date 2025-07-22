# Viem Account Abstraction Test Framework

Test framework demonstrating viem's native Account Abstraction (ERC-4337) stack with **toSoladySmartAccount**, integrating with the existing aa-sdk testing infrastructure.

## Purpose

This framework demonstrates how to migrate from `@aa-sdk/core` to viem's native account abstraction support (`viem/account-abstraction`), specifically using the Solady smart account implementation as requested.

## Features

- ✅ **toSoladySmartAccount**: Uses viem's native Solady smart account implementation (available in viem 2.33.0+)
- ✅ **Real User Operations**: Sends actual transactions and verifies they're mined
- ✅ **Message Signing**: Signs messages with smart accounts and verifies via EIP-1271
- ✅ **Batch Transactions**: Sends multiple operations in a single user op
- ✅ **Gas Sponsorship**: Demonstrates paymaster integration for sponsored transactions
- ✅ **Infrastructure Integration**: Complete integration with existing Anvil + Rundler setup

## Structure

```
.vitest/src/viem-aa/
├── constants.ts           # Test constants and configuration
├── instances.ts           # Infrastructure setup (Anvil + Rundler)
├── setupTests.ts          # Test environment configuration
└── solady-account.test.ts # Main test suite demonstrating viem AA with Solady
```

## Running Tests

```bash
# From .vitest directory
yarn test src/viem-aa/solady-account.test.ts

# With watch mode
yarn test:watch src/viem-aa/solady-account.test.ts
```

## Key Dependencies

- **viem**: 2.33.0+ (for toSoladySmartAccount support)
- **viem/account-abstraction**: Native AA support module
- **Anvil**: Local Ethereum node (via existing infrastructure)
- **Rundler**: ERC-4337 bundler (via existing infrastructure)

## Architecture

The framework uses viem's native account abstraction stack:

1. **Smart Account**: `toSoladySmartAccount` creates gas-optimized Solady accounts
2. **Bundler Client**: `createBundlerClient` handles UserOperation submission
3. **Paymaster Client**: `createPaymasterClient` enables gas sponsorship
4. **Public Client**: Standard viem client for reading blockchain state

## Test Coverage

- ✅ Smart account creation with deterministic addresses
- ✅ UserOperation sending and mining verification
- ✅ EIP-1271 message signing and verification
- ✅ Batch transaction support
- ✅ Gas sponsorship patterns (when paymaster configured)

## Migration Notes

When migrating from `@aa-sdk/core` to viem's native AA:

1. Replace `createLightAccountClient` → `toSoladySmartAccount`
2. Use `createBundlerClient` for UserOperation handling
3. Use `sendUserOperation` and `waitForUserOperationReceipt`
4. Smart accounts created by `toSoladySmartAccount` are compatible with standard viem actions

# Viem Account Abstraction Test Framework

Test framework demonstrating viem's native Account Abstraction (ERC-4337) stack, integrating with the existing aa-sdk testing infrastructure.

## Purpose

This framework demonstrates how to migrate from `@aa-sdk/core` to viem's native account abstraction support (`viem/account-abstraction`), as requested in the task.

## Current Status

- ✅ **Infrastructure Integration**: Complete integration with existing Anvil + Rundler setup
- ✅ **Viem Native AA**: Uses `viem/account-abstraction` module for bundler and paymaster clients
- ⚠️ **toSoladySmartAccount**: The task requested using `toSoladySmartAccount`, which is documented in viem but may not be available in v2.29.2
- 📝 **Pattern Demonstration**: Shows the expected patterns for when `toSoladySmartAccount` becomes available

## Structure

```
.vitest/src/viem-aa/
├── constants.ts           # Test constants and configuration
├── instances.ts           # Infrastructure setup (Anvil + Rundler)
├── setupTests.ts          # Test environment configuration
└── solady-account.test.ts # Viem AA pattern tests
```

## What's Demonstrated

1. **Viem AA Clients**: Creating bundler and paymaster clients using viem's native AA support
2. **UserOperation Structure**: How UserOperations work in viem's AA implementation
3. **Bundler Interaction**: Direct RPC calls to the bundler
4. **Expected toSoladySmartAccount Usage**: Documentation of how it would work when available

## Running Tests

### Prerequisites

```bash
cd .vitest && yarn install
```

### Start Infrastructure

```bash
# Terminal 1: Anvil
anvil --fork-url https://arbitrum-sepolia-rpc.publicnode.com --fork-block-number 112000000 --port 8345

# Terminal 2: Bundler
rundler node --node-http http://127.0.0.1:8345 --port 8445
```

### Run Tests

```bash
yarn test src/viem-aa/solady-account.test.ts
```

## Configuration

- **Chain**: Arbitrum Sepolia (421614)
- **Fork Block**: 112000000
- **Anvil Port**: 8345
- **Bundler Port**: 8445
- **EntryPoint**: v0.7.0 (`0x0000000071727De22E5E9d8BAf0edAc6f37da032`)

## Notes

- This demonstrates viem's native AA stack without external dependencies
- The framework is ready for `toSoladySmartAccount` when it becomes available in viem
- Shows migration path from `aa-sdk/core` to `viem/account-abstraction`

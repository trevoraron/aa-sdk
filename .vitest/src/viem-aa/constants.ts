import { type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { entryPoint07Address } from "viem/account-abstraction";

export const poolId = () => Number(process.env.VITEST_POOL_ID ?? 1);

export const create2deployer: Address =
  "0x4e59b44847b379578588920ca78fbf26c0b4956c";

export const accounts = {
  paymasterOwner: privateKeyToAccount(
    "0x83ee5e9712839dad9c44192aebeb01411d8b4c7577c64cb512ee128f00563578",
  ),
  unfundedAccountOwner: privateKeyToAccount(
    // some randomly generated private key
    "0x83ee5e9712839dad9c44192aebeb01411d8b4c7577c64cb512ee128f00563577",
  ),
  fundedAccountOwner: privateKeyToAccount(
    // this is a default private key used in anvil
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  ),
};

// EntryPoint v0.7.0 address
export const ENTRYPOINT_ADDRESS_V07 = entryPoint07Address;

// Arbitrum Sepolia fork block with Solady contracts deployed
// Using a recent block from Arbitrum Sepolia
export const SOLADY_FORK_BLOCK = 112000000;

// Default bundler RPC endpoint for testing
export const getBundlerRpcUrl = (port: number) =>
  `http://127.0.0.1:${port}${process.env.VITEST_POOL_ID ? `/${poolId()}` : ""}`;

// Default anvil RPC endpoint for testing
export const getAnvilRpcUrl = (port: number) =>
  `http://127.0.0.1:${port}${process.env.VITEST_POOL_ID ? `/${poolId()}` : ""}`;

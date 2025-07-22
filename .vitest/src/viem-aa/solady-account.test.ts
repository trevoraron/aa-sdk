import {
  createBundlerClient,
  toSoladySmartAccount,
} from "viem/account-abstraction";
import { createPublicClient, parseEther } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { describe, it, expect, beforeAll } from "vitest";
import { local070Instance } from "../instances";
import { setBalance, getBlockNumber } from "viem/actions";

describe("Viem AA - Solady Smart Account", () => {
  let client: ReturnType<typeof local070Instance.getClient>;

  beforeAll(async () => {
    client = local070Instance.getClient();
    // Test that infrastructure is running
    const blockNumber = await getBlockNumber(client);
    expect(blockNumber).toBeGreaterThan(0n);
  }, 30_000);

  it("should send a user operation and verify it was mined", async () => {
    const owner = privateKeyToAccount(generatePrivateKey());

    // Create bundler client using the existing transport
    const bundlerClient = createBundlerClient({
      ...local070Instance.clientConfig,
    });

    // Create public client using the existing transport
    const publicClient = createPublicClient({
      ...local070Instance.clientConfig,
    });

    // Create Solady smart account
    const smartAccount = await toSoladySmartAccount({
      client: publicClient,
      owner,
    });

    // Fund the smart account
    await setBalance(client, {
      address: smartAccount.address,
      value: parseEther("1"),
    });

    // Fund the owner address (target of the transfer)
    await setBalance(client, {
      address: owner.address,
      value: parseEther("0"),
    });

    // Send a user operation
    const userOpHash = await bundlerClient.sendUserOperation({
      account: smartAccount,
      calls: [
        {
          to: owner.address,
          value: parseEther("0.01"),
        },
      ],
    });

    expect(userOpHash).toBeDefined();
    expect(userOpHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

    // Wait for the user operation to be mined
    const receipt = await bundlerClient.waitForUserOperationReceipt({
      hash: userOpHash,
      timeout: 30_000,
    });

    expect(receipt).toBeDefined();
    expect(receipt.success).toBe(true);
    expect(receipt.userOpHash).toBe(userOpHash);
    expect(receipt.receipt.transactionHash).toBeDefined();

    // Verify the balance was transferred
    const balance = await publicClient.getBalance({
      address: owner.address,
    });
    expect(balance).toBe(parseEther("0.01"));
  });

  it("should sign a message using a smart account and verify the signature", async () => {
    const owner = privateKeyToAccount(generatePrivateKey());

    const publicClient = createPublicClient({
      ...local070Instance.clientConfig,
    });

    const smartAccount = await toSoladySmartAccount({
      client: publicClient,
      owner,
    });

    // Fund the smart account for deployment
    await setBalance(client, {
      address: smartAccount.address,
      value: parseEther("0.1"),
    });

    // Sign a message
    const message = "Hello from Viem AA!";
    const signature = await smartAccount.signMessage({
      message,
    });

    expect(signature).toBeDefined();
    expect(signature).toMatch(/^0x[a-fA-F0-9]+$/);

    // Verify the signature using viem's verifyMessage
    const isValid = await publicClient.verifyMessage({
      address: smartAccount.address,
      message,
      signature,
    });

    expect(isValid).toBe(true);
  });
});

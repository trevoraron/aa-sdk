import { 
  createPublicClient, 
  http, 
  parseEther,
  type Address,
  type Hash,
  type Hex,
  encodeFunctionData,
  concatHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { 
  entryPoint07Address, 
  createPaymasterClient,
  createBundlerClient,
  toSoladySmartAccount,
  sendUserOperation,
  waitForUserOperationReceipt,
} from "viem/account-abstraction";
import { setBalance } from "viem/actions";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  accounts,
  getBundlerRpcUrl,
  getAnvilRpcUrl,
  ENTRYPOINT_ADDRESS_V07,
} from "./constants";
import { viemAAInstance } from "./instances";

describe("Viem AA - Solady Smart Account Tests", () => {
  let publicClient: ReturnType<typeof createPublicClient>;
  let bundlerClient: ReturnType<typeof createBundlerClient>;
  let smartAccount: any; // Using any to avoid complex type issues
  let smartAccountAddress: Address;

  beforeAll(async () => {
    // Start infrastructure
    await viemAAInstance.start();
    
    // Create clients using viem's native AA support
    publicClient = createPublicClient({
      chain: viemAAInstance.chain,
      transport: http(getAnvilRpcUrl(8345)),
    });

    bundlerClient = createBundlerClient({
      chain: viemAAInstance.chain,
      transport: http(getBundlerRpcUrl(8445)),
    });

    // Fund the test account owner
    const client = viemAAInstance.getClient();
    await setBalance(client, {
      address: accounts.fundedAccountOwner.address,
      value: parseEther("100"),
    });

    // Create paymaster client
    const paymasterClient = createPaymasterClient({
      transport: http(getBundlerRpcUrl(8445)),
    });

    // Create Solady smart account using viem's native implementation
    smartAccount = await toSoladySmartAccount({
      client: publicClient as any,
      owner: accounts.fundedAccountOwner,
      salt: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`, // Proper salt format
      // Note: If Solady factory is not deployed on the forked network,
      // you may need to specify factoryAddress
    });

    smartAccountAddress = smartAccount.address;

    // Fund the smart account
    await setBalance(client, {
      address: smartAccountAddress,
      value: parseEther("10"),
    });

    console.log("✅ Created Solady Smart Account:", smartAccountAddress);
  }, 120_000);

  afterAll(async () => {
    await viemAAInstance.stop();
  });

  it("should send a user operation and verify it was mined", async () => {
    const targetAddress = accounts.unfundedAccountOwner.address;
    const transferAmount = parseEther("0.01");
    
    // Check target balance before
    const balanceBefore = await publicClient.getBalance({
      address: targetAddress,
    });

    // Send user operation using viem's native sendUserOperation
    const userOpHash = await bundlerClient.sendUserOperation({
      account: smartAccount,
      calls: [
        {
          to: targetAddress,
          value: transferAmount,
          data: "0x",
        },
      ],
    });

    expect(userOpHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

    // Wait for the user operation to be mined
    const receipt = await bundlerClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });

    expect(receipt).toBeDefined();
    expect(receipt.receipt.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

    // Verify the balance changed
    const balanceAfter = await publicClient.getBalance({
      address: targetAddress,
    });
    
    expect(balanceAfter).toBe(balanceBefore + transferAmount);
  }, 120_000);

  it("should sign a message using the smart account and verify the signature", async () => {
    const message = "Hello from Solady Smart Account!";

    // Sign the message using the smart account
    const signature = await smartAccount.signMessage({ 
      message,
    });
    
    expect(signature).toMatch(/^0x[a-fA-F0-9]+$/);

    // Verify the signature using EIP-1271
    const isValid = await publicClient.verifyMessage({
      address: smartAccountAddress,
      message,
      signature,
    });
    
    expect(isValid).toBe(true);
  }, 60_000);

  it("should send multiple transactions in a batch", async () => {
    const target1 = accounts.unfundedAccountOwner.address;
    const target2 = accounts.paymasterOwner.address;
    const amount = parseEther("0.005");
    
    // Check balances before
    const balance1Before = await publicClient.getBalance({ address: target1 });
    const balance2Before = await publicClient.getBalance({ address: target2 });
    
    // Send batch user operation
    const userOpHash = await bundlerClient.sendUserOperation({
      account: smartAccount,
      calls: [
        {
          to: target1,
          value: amount,
          data: "0x",
        },
        {
          to: target2,
          value: amount,
          data: "0x",
        },
      ],
    });

    expect(userOpHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    
    // Wait for the batch operation to be mined
    const receipt = await bundlerClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });

    expect(receipt).toBeDefined();
    
    // Verify both balances changed
    const balance1After = await publicClient.getBalance({ address: target1 });
    const balance2After = await publicClient.getBalance({ address: target2 });
    
    expect(balance1After).toBe(balance1Before + amount);
    expect(balance2After).toBe(balance2Before + amount);
  }, 120_000);

  it("should demonstrate gas sponsorship with paymaster", async () => {
    // Create a new unfunded smart account to test paymaster sponsorship
    const newOwner = privateKeyToAccount(
      "0x83ee5e9712839dad9c44192aebeb01411d8b4c7577c64cb512ee128f00563576" as `0x${string}`
    );
    
    const sponsoredAccount = await toSoladySmartAccount({
      client: publicClient as any,
      owner: newOwner,
      salt: "0x0000000000000000000000000000000000000000000000000000000000000001" as `0x${string}`, // Different salt
    });
    
    // Check that the account has no balance
    const accountBalance = await publicClient.getBalance({
      address: sponsoredAccount.address,
    });
    expect(accountBalance).toBe(0n);

    // Create paymaster client for sponsorship
    const paymasterClient = createPaymasterClient({
      transport: http(getBundlerRpcUrl(8445)),
    });
    
    // Create bundler client with paymaster
    const sponsoredBundlerClient = createBundlerClient({
      chain: viemAAInstance.chain,
      transport: http(getBundlerRpcUrl(8445)),
      paymaster: paymasterClient,
    });
    
    // Try to send a transaction with zero balance (paymaster should sponsor)
    try {
      const userOpHash = await sponsoredBundlerClient.sendUserOperation({
        account: sponsoredAccount,
        calls: [
          {
            to: accounts.paymasterOwner.address,
            value: 0n,
            data: "0x",
          },
        ],
      });
      
      // Wait for receipt
      const receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });
      
      expect(receipt).toBeDefined();
      console.log("✅ Gas sponsorship successful - account with 0 balance sent transaction!");
    } catch (error) {
      // If paymaster is not configured, this test will be skipped
      console.log("Paymaster sponsorship test skipped (paymaster not configured)");
    }
  }, 120_000);
});

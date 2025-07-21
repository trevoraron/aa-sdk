import dotenv from "dotenv";
dotenv.config();

import getPort from "get-port";
import { createServer } from "prool";
import { anvil } from "prool/instances";
import {
  createClient,
  createPublicClient,
  http,
  type Chain,
  type ClientConfig,
} from "viem";
import { arbitrumSepolia } from "viem/chains";
import { entryPoint07Address } from "viem/account-abstraction";
// NOTE: These would be the real imports when permissionless.js is installed:
// import { createSmartAccountClient } from "permissionless";
// import { createPimlicoClient } from "permissionless/clients/pimlico";
import { split } from "../../../aa-sdk/core/src/transport/split";
import {
  poolId,
  getBundlerRpcUrl,
  getAnvilRpcUrl,
  SOLADY_FORK_BLOCK,
} from "./constants";
import { rundler } from "../rundler/instance";

export const viemAAInstance = defineViemAAInstance({
  chain: {
    ...arbitrumSepolia,
    name: `${arbitrumSepolia.name} (Local)`,
  },
  forkBlockNumber: SOLADY_FORK_BLOCK,
  forkUrl:
    process.env.VITEST_ARB_SEPOLIA_FORK_URL ??
    "https://arbitrum-sepolia-rpc.publicnode.com",
  anvilPort: 8345,
  bundlerPort: 8445,
});

type DefineViemAAInstanceParams = {
  chain: Chain;
  forkUrl: string;
  forkBlockNumber?: number;
  anvilPort: number;
  bundlerPort: number;
  useLocalRunningInstance?: boolean;
};

const bundlerMethods = [
  "eth_sendUserOperation",
  "eth_estimateUserOperationGas",
  "eth_getUserOperationReceipt",
  "eth_getUserOperationByHash",
  "eth_supportedEntryPoints",
  "debug_bundler_sendBundleNow",
  "debug_bundler_dumpMempool",
  "debug_bundler_clearState",
  "debug_bundler_setBundlingMode",
  "rundler_maxPriorityFeePerGas",
];

function defineViemAAInstance(params: DefineViemAAInstanceParams) {
  const {
    anvilPort,
    bundlerPort,
    forkUrl,
    forkBlockNumber,
    chain: chain_,
    useLocalRunningInstance,
  } = params;

  const rpcUrls = () => ({
    bundler: getBundlerRpcUrl(bundlerPort),
    anvil: getAnvilRpcUrl(anvilPort),
  });

  const chain = {
    ...chain_,
    rpcUrls: {
      default: {
        http: [rpcUrls().anvil],
      },
    },
  } as const satisfies Chain;

  const clientConfig = {
    chain,
    transport(args) {
      const {
        config,
        request: request_,
        value,
      } = split({
        overrides: [
          {
            methods: bundlerMethods,
            transport: http(rpcUrls().bundler),
          },
        ],
        fallback: http(rpcUrls().anvil),
      })(args);

      return {
        config,
        async request(params, opts) {
          return await request_(params, opts);
        },
        value,
      };
    },
  } as const satisfies ClientConfig;

  const anvilServer = createServer({
    instance: anvil({
      forkUrl: forkUrl,
      forkBlockNumber,
      chainId: chain.id,
    }),
    port: anvilPort,
  });

  const bundlerServer = createServer({
    instance: (key) =>
      rundler(
        {
          binary: process.env.RUNDLER_BINARY_PATH || "rundler",
          nodeHttp: `${getAnvilRpcUrl(anvilPort)}/${key}`,
          rpc: {
            api: "eth,rundler,debug",
          },
        },
        { messageBuffer: 10 },
      ),
    port: bundlerPort,
  });

  return {
    chain,
    clientConfig,
    anvilServer,
    bundlerServer,
    getClient() {
      return createClient({
        ...clientConfig,
        chain,
        transport: clientConfig.transport,
      }).extend(() => ({ mode: "anvil" }));
    },
    getPublicClient() {
      return createPublicClient({
        chain,
        transport: http(rpcUrls().anvil),
      });
    },
    getBundlerClient() {
      return createClient({
        chain,
        transport: http(rpcUrls().bundler),
      });
    },
    // NOTE: These would be available when permissionless.js is installed:
    /*
     getPimlicoClient() {
       return createPimlicoClient({
         transport: http(rpcUrls().bundler),
         entryPoint: {
           address: entryPoint07Address,
           version: "0.7",
         },
       });
     },
     createSmartAccountClient(account: any) {
       return createSmartAccountClient({
         account,
         chain,
         bundlerTransport: http(rpcUrls().bundler),
         userOperation: {
           estimateFeesPerGas: async () => {
             return {
               maxFeePerGas: 1000000000n,
               maxPriorityFeePerGas: 1000000000n,
             };
           },
         },
       });
     },
     */
    async restart() {
      if (useLocalRunningInstance) return;

      await fetch(`${rpcUrls().anvil}/restart`);
      await fetch(`${rpcUrls().bundler}/restart`);
    },
    async start() {
      if (useLocalRunningInstance) return async () => {};

      if ((await getPort({ port: anvilPort })) === anvilPort) {
        await anvilServer.start();
      }
      if ((await getPort({ port: bundlerPort })) === bundlerPort) {
        await bundlerServer.start();
      }

      return async () => {
        await bundlerServer.stop();
        await anvilServer.stop();
      };
    },
    async stop() {
      if (useLocalRunningInstance) return;

      await anvilServer.stop();
      await bundlerServer.stop();
    },
    async getLogs(server: "anvil" | "bundler") {
      const port = server === "anvil" ? anvilPort : bundlerPort;
      const url = `${server === "anvil" ? getAnvilRpcUrl(port) : getBundlerRpcUrl(port)}/messages`;

      const response = await fetch(url);
      return await response.json();
    },
  };
}

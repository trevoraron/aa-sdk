import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";
import { setAutomine } from "viem/actions";
import { beforeAll, afterEach, afterAll, onTestFailed } from "vitest";
import { poolId } from "./constants";
import { viemAAInstance } from "./instances";

// @ts-expect-error this does exist but ts is not liking it
global.fetch = fetch;

beforeAll(async () => {
  const client = viemAAInstance.getClient();
  await setAutomine(client, true);
}, 60_000);

afterEach(() => {
  onTestFailed(async () => {
    console.log(`Logs for failed viem AA test [${poolId()}]:`);
    console.log(await viemAAInstance.getLogs("anvil"));
    console.log(await viemAAInstance.getLogs("bundler"));
  });
});

afterAll(async () => {
  await viemAAInstance.stop();
});

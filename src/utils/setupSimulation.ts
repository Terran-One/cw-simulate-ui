import { CWChain, CWSimulateEnv } from "@terran-one/cw-simulate";

export interface ChainConfig {
  chainId: string;
  bech32Prefix: string;
}

export const createSimulateEnv = (): CWSimulateEnv => {
  return new CWSimulateEnv();
}

export const creatChain = (env: CWSimulateEnv, chainConfig: ChainConfig): CWChain => {
  return env.createChain(chainConfig);
}

export const createContractInstance = async (chain: CWChain, wasmByteCode: Buffer) => {
  const code = chain.storeCode(wasmByteCode);
  return await chain.instantiateContract(code.codeId);
}

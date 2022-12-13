import { CodeInfo, Coin, ContractInfo, CWSimulateApp, CWSimulateAppOptions, TraceLog } from "@terran-one/cw-simulate";
import * as persist from "@terran-one/cw-simulate/dist/persist";
import { TransactionalLens } from "@terran-one/cw-simulate/dist/store/transactional";
import { DependencyList, Dispatch, useEffect, useReducer } from "react";
import { Ok } from "ts-results";
import { defaults } from "./configs/constants";
import { getStepTrace } from "./utils/commonUtils";

type Watcher<T> = {
  /** Must be the same object instance as returned by reducer */
  state: WatcherState<T>;
  dispatch: Dispatch<T>;
}

type WatcherState<T> = {
  params: {
    /** Get the value to filter for. */
    filter(app: CWSimulateApp): T;
    /** Compare old vs new value. Return true when identical. Defaults to strict equality. */
    compare(lhs: T, rhs: T): boolean;
    /** Create an independent clone of the given value which can be used to compare for differences. Defaults to identity. */
    commit(value: T): T;
    /** When set, logs additional debugging information with prefix. */
    debug: string | undefined;
  };
  /** Current value. Used in comparison. */
  value: T;
}

export type WatcherComparator<T = unknown> = (last: T, curr: T) => boolean;
export type WatcherCommitter<T = unknown> = (raw: T) => T;

export type AccountEx = {
  label?: string;
}

export type FileUploadType = {
  name: string;
  schema: JSON;
  content: Buffer | JSON;
}

export type CodeInfoEx = CodeInfo & {
  name?: string;
  schema?: JSON;
  hidden?: boolean;
}

export type ContractInfoEx = ContractInfo & {
  trace?: TraceLog[];
  hidden?: boolean;
}

export default class CWSimulationBridge {
  private app = new CWSimulateApp(defaults.chains.terra);
  private watchers = new Set<Watcher<any>>();
  private updatePending = false;

  private _codes: TransactionalLens<Record<number, CodeInfoEx>> | undefined;
  private _contracts: TransactionalLens<Record<string, ContractInfoEx>> | undefined;
  
  constructor() {
    this._createLenses();
  }

  /** Recreate the simulation instance, clearing all state. */
  recreate(options: CWSimulateAppOptions) {
    this.app = new CWSimulateApp(options);
    this._createLenses();
    this.sync();
    return this;
  }
  
  protected _createLenses() {
    this._codes = this.app.store.db.lens<Record<number, CodeInfoEx>>('wasm', 'codes');
    this._contracts = this.app.store.db.lens<Record<string, ContractInfoEx>>('wasm', 'contracts');
  }

  /** Update chain configuration & re-sync bridge. */
  updateChainConfig(chainId: string, bech32Prefix: string) {
    this.app.chainId = chainId;
    this.app.bech32Prefix = bech32Prefix;
    localStorage['chainId'] = chainId;
    this.sync();
    return this;
  }

  /** Get all accounts from the simulation. */
  getAccounts() {
    return this.app.bank.store.getObject('balances');
  }

  /** Get a specific contract code from the simulation, augmented by given `codeId` for convenience. */
  getCode(codeId: number) {
    const code = this.codes.getObject(codeId);
    if (!code) return;
    return Object.assign(code, { codeId });
  }

  /** Store a new smart contract code in the simulation & re-sync bridge. */
  storeCode(sender: string, fileUpload: FileUploadType, funds: Coin[] = []) {
    const codeId = this.app.wasm.create(sender, fileUpload.content as Buffer);

    // inject contract name for convenient lookup.
    this.codes.tx(setter => {
      setter(codeId, 'name')(fileUpload.name);
      setter(codeId, 'schema')(fileUpload.schema);
      return Ok(undefined);
    });

    this.sync();
    return codeId;
  }

  /** Hide a contract from the UI - it is not actually deleted - and re-sync bridge. */
  hideCode(codeId: number) {
    this.codes.tx(setter => {
      setter(codeId, 'hidden')(true);
      return Ok(undefined);
    });
    this.sync();
    return this;
  }

  /** Get contract associated with given address, and augment contract info with same address for convenience. */
  getContract(address: string) {
    const contract = this.contracts.getObject(address);
    if (!contract) return;
    return Object.assign(contract, { address });
  }

  /** Create a new contract instance by `codeId` & re-sync bridge. */
  async instantiate(sender: string, codeId: number, msg: any, funds: Coin[] = [], label:string) {
    if (!this.getCode(codeId)) throw new Error(`Invalid codeId ${codeId}`);

    const trace: TraceLog[] = [];
    const result = await this.app.wasm.instantiateContract(sender, funds, codeId, msg, label, trace);
    const response = result.unwrap();

    const evt = response.events[0];
    if (evt.type !== 'instantiate') throw new Error('Expected instantiation event');
    const address = evt.attributes.find(attr => attr.key === '_contract_address')?.value;
    if (!address) {
      console.error('Failed to instantiate. Response:', response);
      throw new Error('Failed to instantiate. See logs for details');
    }

    const info = this.getContract(address)!;
    this.contracts.tx(setter => {
      setter(address, 'trace')(trace);
      return Ok(undefined);
    });

    this.sync();
    return info;
  }

  /** Execute given smart contract & re-sync bridge. */
  async execute(sender: string, contractAddress: string, msg: any, funds: Coin[] = []) {
    const info = this.getContract(contractAddress);
    if (!info) throw new Error(`No such contract with address ${contractAddress}`);

    const trace = info.trace ?? [];
    const result = await this.app.wasm.executeContract(sender, funds, contractAddress, msg, trace);
    this.contracts.tx(setter => {
      setter(contractAddress, 'trace')(trace);
      return Ok(undefined);
    });
    this.sync();
    return result;
  }

  /** Hide contract associated with address - it is not actually removed from the simulation - and re-sync bridge. */
  hideContract(address: string) {
    this.contracts.tx(setter => {
      setter(address, 'hidden')(true);
      return Ok(undefined);
    });
    this.sync();
    return this;
  }

  /** Set the new account balance of given address, overriding any previous balance, and re-sync bridge. */
  setBalance(account: string, balance: Coin[]) {
    this.app.bank.setBalance(account, balance);
    this.sync();
    return this;
  }

  /** Remove an account from the simulation entirely. Traces of prior transactions are retained. */
  deleteBalance(account: string) {
    this.app.bank.deleteBalance(account);
    this.sync();
    return this;
  }

  /** Create a new watcher which will be updated whenever changes to the simulation are detected, according to its
   * parameters.
   */
  useWatcher<T>(
    filter: (app: CWSimulateApp) => T,
    /** Whether last stored value is equal to current. Defaults to strict equality. */
    compare: WatcherComparator<T> = compareStrict,
    /** Optional committer. Creates a non-mutable snapshot of the given state. Defaults to identity. */
    commit: WatcherCommitter<T> = val => val,
    deps: DependencyList = [],
    debug?: string,
  ) {
    const params = { filter, compare, commit, debug };

    // eslint not smart enough to tell we're not actually in a class component
    /* eslint-disable react-hooks/rules-of-hooks */
    const [state, dispatch] = useBridgeReducer<T>(this.app, params);

    // re-register watcher when any callbacks or deps change
    useEffect(() => {
      const watcher = {
        state,
        dispatch,
      };

      this.watchers.add(watcher);
      state.params = params;

      return () => {
        this.watchers.delete(watcher);
      };
    }, [filter, compare, commit, debug, ...deps]);

    // re-evaluate this watcher only when deps change
    // this prevents anonymous functions & arrow functions from continuously triggering updates
    useEffect(() => {
      const watcher = this.findWatcher(state);
      watcher && this.evaluateWatcher(watcher);
    }, deps);

    return state.value;
  }

  /** Execute smart query using `msg` on given `step`'s trace log. */
  async query(contractAddress: string, msg: any, step: string) {
    const info = this.getContract(contractAddress);
    if (!info) throw new Error(`No such contract with address ${contractAddress}`);
    return await this.app.wasm.queryTrace(getStepTrace(step, info.trace ?? []), msg);
  }
  
  save() {
    return persist.save(this.app);
  }
  
  async load(bytes: Uint8Array) {
    this.app = await persist.load(bytes);
    this._createLenses();
    this.sync();
    return this;
  }

  /** Re-synchronize simulation bridge with its CWSimulateApp, calling
   * watchers as appropriate.
   */
  sync() {
    if (this.updatePending) return;
    this.updatePending = true;

    setTimeout(() => {
      console.log(`CWSimulationBridge: ${this.watchers.size} watchers`);
      this.updatePending = false;
      this.watchers.forEach(this.evaluateWatcher);
    }, 0);
  }

  /** Find a watcher by its state. */
  private findWatcher = <T>(state: WatcherState<T>): Watcher<T> | undefined => {
    for (const watcher of this.watchers) {
      if (watcher.state === state) return watcher;
    }
  }

  /** Evaluate the given watcher, detecting if changes have occurred
   * and triggering UI updates where appropriate.
   */
  private evaluateWatcher = (inst: Watcher<any>) => {
    const {
      state: {
        params: {
          filter,
          compare,
          commit,
          debug,
        },
        value: last,
      },
      dispatch,
    } = inst;

    const next = filter(this.app);
    if (!compare(last, next)) {
      debug && console.log(`[${debug}] update`);
      dispatch(commit(next));
    }
  }

  /** Shorten the given address if its length is > `minLength`. Recommended & default `minLength` is 20. */
  shortenAddress(addr: string, minLength = 20) {
    if (addr.length < minLength) return addr;

    const prefix = this.bech32Prefix;
    if (!addr.startsWith(prefix)) {
      const before = addr.substring(0, 10);
      const after  = addr.substring(addr.length - 5);
      return `${before}...${after}`;
    }
    else {
      const prefixless = addr.substring(prefix.length);
      const before = prefixless.substring(0, 5);
      const after  = prefixless.substring(prefixless.length - 5);
      return `${prefix}${before}...${after}`;
    }
  }

  get chainId() {
    return this.app.chainId;
  }
  get bech32Prefix() {
    return this.app.bech32Prefix;
  }
  
  get codes() { return this._codes! }
  get contracts() { return this._contracts! }
}

function useBridgeReducer<T>(app: CWSimulateApp, params: Omit<WatcherState<T>['params'], 'value'>) {
  const { filter, commit } = params;
  return useReducer(
    (state: WatcherState<T>, next: T) => {
      return {
        params: state.params,
        value: next,
      };
    },
    // use initializer arg w/ initializer so initial `value` is computed only once
    params,
    (params => ({ params, value: commit(filter(app)) })),
  );
}

export function useAccounts(bridge: CWSimulationBridge) {
  return bridge.useWatcher(
    app => {
      const balances = app.bank.store.getObject('balances');
      const contractAddresses = app.wasm.store.get('contracts').keys();
      for (const contractAddress of contractAddresses) {
        delete balances[contractAddress];
      }
      return balances;
    },
    compareShallowObject,
  );
}

export function useCode(bridge: CWSimulationBridge, codeId: number) {
  return bridge.useWatcher(
    () => bridge.getCode(codeId),
    compareCodes,
    undefined,
    [codeId],
  );
}

export function useCodes(bridge: CWSimulationBridge) {
  return bridge.useWatcher(
    () => bridge.codes.getObject() ?? {},
    compareManyCodes,
  )
}

export function useContracts(
  bridge: CWSimulationBridge,
  compare: WatcherComparator<Record<string, ContractInfo>> = compareDeep,
) {
  return bridge.useWatcher(
    app => bridge.contracts.getObject(),
    compare,
  )
}

export function useContractTrace(
  bridge: CWSimulationBridge,
  contractAddress: string,
) {
  // Trace is currently not persistent, but we can just commit clones for comparison
  return bridge.useWatcher(
    () => bridge.getContract(contractAddress)?.trace ?? [],
    compareShallowArray,
    trace => trace.slice(),
    [contractAddress],
  );
}

export const compareStrict = (last: unknown, curr: unknown) => last === curr;
/** Compares each element of two arrays by identity. Order matters. */
export function compareShallowArray(last: unknown[], curr: unknown[]) {
  if (last.length !== curr.length) return false;
  for (let i = 0; i < last.length; ++i) {
    if (last[i] !== curr[i]) return false;
  }
  return true;
}
/** Compares each property of two objects by identity. Order of properties does not matter. */
export function compareShallowObject(last: any, curr: any) {
  if (!compareShallowArray(Object.keys(last), Object.keys(curr)))
    return false;
  for (const prop in last) {
    if (last[prop] !== curr[prop]) return false;
  }
  return true;
}
export function compareDeep(lhs: any, rhs: any): boolean {
  // easy cases
  if (lhs === rhs)
    return true;
  if ([rhs, lhs].find(v => !v || typeof v !== 'object'))
    return lhs === rhs;

  // assert both objects have same keys
  const lKeys = new Set(Object.keys(lhs));
  const rKeys = new Set(Object.keys(rhs));
  for (const key of lKeys)
    if (!rKeys.has(key)) return false;
  for (const key of rKeys)
    if (!lKeys.has(key)) return false;

  // recurse
  for (const key in lhs) {
    if (!compareDeep(lhs[key], rhs[key]))
      return false;
  }
  return true;
}

function compareCodes(lhs: CodeInfoEx | undefined, rhs: CodeInfoEx | undefined): boolean {
  if (!lhs || !rhs) return false;
  if (lhs.creator !== rhs.creator) return false;
  if (lhs.hidden !== rhs.hidden) return false;
  if (lhs.name !== rhs.name) return false;
  return true;
}

function compareManyCodes(lhs: Record<number, CodeInfoEx>, rhs: Record<number, CodeInfoEx>): boolean {
  const lkeys = new Set(Object.keys(lhs)) as any as Set<number>;
  const rkeys = new Set(Object.keys(rhs)) as any as Set<number>;
  if (lkeys.size !== rkeys.size) return false;

  for (const lkey of lkeys)
    if (!rkeys.has(lkey)) return false;
  for (const rkey of rkeys)
    if (!lkeys.has(rkey)) return false;

  for (const key of lkeys) {
    if (!compareCodes(lhs[key], rhs[key]))
      return false;
  }
  return true;
}

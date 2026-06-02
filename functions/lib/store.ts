import { emptyStore, STORE_KEY, type DataStore } from "./types";

export async function readStore(kv: KVNamespace): Promise<DataStore> {
  const raw = await kv.get(STORE_KEY);
  if (!raw) return emptyStore();
  try {
    return JSON.parse(raw) as DataStore;
  } catch {
    return emptyStore();
  }
}

export async function writeStore(kv: KVNamespace, store: DataStore): Promise<void> {
  await kv.put(STORE_KEY, JSON.stringify(store));
}

export async function mutateStore(
  kv: KVNamespace,
  fn: (store: DataStore) => void | Promise<void>,
): Promise<DataStore> {
  const store = await readStore(kv);
  await fn(store);
  await writeStore(kv, store);
  return store;
}

export function newId(): string {
  return crypto.randomUUID();
}

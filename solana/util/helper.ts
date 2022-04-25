import {PublicKey} from "@solana/web3.js";

const PubKeysInternedMap = new Map<string, PublicKey>();
export const toPublicKey = (key: string | PublicKey) => {
  if (typeof key !== `string`) {
    return key;
  }

  let result = PubKeysInternedMap.get(key);
  if (!result) {
    result = new PublicKey(key);
    PubKeysInternedMap.set(key, result);
  }

  return result;
};
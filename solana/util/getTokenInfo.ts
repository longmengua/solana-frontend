import { Mint, getMint } from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { PublicKey, Connection, TokenAmount, RpcResponseAndContext } from "@solana/web3.js";
import { StateI } from "../module/components/index";

export const getTokenInfo = async (p: {
  state: StateI, 
  connection: Connection, 
  sendTransaction: WalletContextState['sendTransaction'],
}): Promise<Mint> => {
  const { 
    state,
    connection,
    sendTransaction,
  } = p;

  if(!state.mintToken) throw new Error('missing token address')

  const mint = new PublicKey(state.mintToken)
  const mintInfo: Mint = await getMint(
    connection,
    mint,
  )

  return mintInfo;
}
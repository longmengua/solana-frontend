import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, RpcResponseAndContext, TokenAmount } from "@solana/web3.js";
import { StateI } from "../module/components/index/index";
import { getTokenAccount } from "./getTokenAccount";

export const getBurntTokenBalance = async (p: {
  state: StateI, 
  publicKey: PublicKey, 
  connection: Connection, 
  sendTransaction: WalletContextState['sendTransaction'],
}): Promise<TokenAmount> => {
  const { 
    publicKey,
    state,
    connection,
    sendTransaction,
  } = p;

  if(!state.mintToken) throw new Error('missing token address')

  let tokenBalance: TokenAmount;
  
  const ATA = await getTokenAccount({
    connection,
    mint: new PublicKey(state.mintToken),
    owner: publicKey,
    payer: publicKey,
    sendTransaction,
  });
  const result: RpcResponseAndContext<TokenAmount> = await connection.getTokenAccountBalance(ATA.address)
  tokenBalance = result.value;
  console.log('info', result);

  return tokenBalance;
}
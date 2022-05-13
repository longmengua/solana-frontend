import { createBurnCheckedInstruction, createBurnInstruction } from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { PublicKey, Connection, Transaction } from "@solana/web3.js";
import { StateI } from "../module/components/index";
import { getTokenAccount } from "./getTokenAccount";


export const burnMintToken = async (p: {
  state: StateI, 
  publicKey: PublicKey, 
  connection: Connection, 
  sendTransaction: WalletContextState['sendTransaction'],
}) => {
  const { 
    publicKey,
    state,
    connection,
    sendTransaction,
  } = p;

  const mint: PublicKey =  new PublicKey(state.mintToken || '');
  const receiver: PublicKey =  new PublicKey(state.receiver || '');

  const ATAto = await getTokenAccount({
    connection,
    mint,
    owner: receiver,
    payer: publicKey,
    sendTransaction,
  });

  const transaction = new Transaction().add(
    createBurnCheckedInstruction(
      ATAto.address,
      mint,
      publicKey,
      state.amountToSend * (10 ** 9),
      9,
    )
  );

  const signature = await sendTransaction(transaction, connection)

  connection.confirmTransaction(signature);
}
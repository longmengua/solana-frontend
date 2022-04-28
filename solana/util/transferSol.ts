import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";


export const transferSol = async (p: {
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  lamports: number, // amount * decimal
  sendTransaction: WalletContextState['sendTransaction'],
  connection: Connection,
}) => {
  const { fromPubkey, toPubkey, lamports, connection, sendTransaction } = p;

  if (!fromPubkey) throw new WalletNotConnectedError();

  const transaction = new Transaction().add(
      SystemProgram.transfer({
          fromPubkey: fromPubkey,
          toPubkey: toPubkey,
          lamports: lamports,
      })
  );

  const signature = await sendTransaction(transaction, connection);

  await connection.confirmTransaction(signature);
}
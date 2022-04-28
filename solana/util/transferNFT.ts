import { publicKey } from "@project-serum/anchor/dist/cjs/utils";
import { createTransferCheckedInstruction } from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { getTokenAccount } from "./getTokenAccount";


export const transferNFT = async (p: {
  nft: PublicKey, // NFT token address.
  from: PublicKey,
  to: PublicKey,
  sendTransaction: WalletContextState['sendTransaction'],
  connection: Connection,
}) => {
  const { connection, nft, from, to, sendTransaction } = p

  const ATAfrom = await getTokenAccount({
    connection,
    mint: nft,
    owner: from,
    payer: from,
    sendTransaction,
  });

  const ATAto = await getTokenAccount({
    connection,
    mint: nft,
    owner: to,
    payer: from,
    sendTransaction,
  });

  /**
   * Construct a TransferChecked instruction
   *
   * @param source       Source account
   * @param mint         Mint account
   * @param destination  Destination account
   * @param owner        Owner of the source account
   * @param amount       Number of tokens to transfer
   * @param decimals     Number of decimals in transfer amount
   * @param multiSigners Signing accounts if `owner` is a multisig
   * @param programId    SPL Token program account
   *
   * @return Instruction to add to a transaction
   */
  const transaction = new Transaction().add(
    createTransferCheckedInstruction(
      ATAfrom.address,
      nft,
      ATAto.address,
      from,
      1,
      0,
    )
  )

  connection.confirmTransaction(await sendTransaction(transaction, connection));
}
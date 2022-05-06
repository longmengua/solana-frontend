import { getOrCreateAssociatedTokenAccount, Account, transfer } from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

export const transferNFTwithPrivateKey = async (p: {
  privateKey: string,
  nftTokenAddress: string,
  receiver: string,
  sendTransaction: WalletContextState['sendTransaction'],
  connection: Connection,
}) => {
  const {
    privateKey: payerPrivateKey,
    nftTokenAddress,
    receiver,
    sendTransaction,
    connection
  } = p;

    if(!payerPrivateKey) throw new Error('missing private key');

    const secretKey: Uint8Array = Uint8Array.from(bs58.decode(payerPrivateKey))
    const payer = Keypair.fromSecretKey(secretKey);    
    const nft: PublicKey =  new PublicKey(nftTokenAddress || '');
    const _receiver: PublicKey = new PublicKey(receiver); 

    const ATAfrom: Account = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      nft,
      payer.publicKey,
    )

    const ATAto: Account = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      nft,
      _receiver,
    )

    transfer(
      connection,
      payer,
      ATAfrom.address,
      ATAto.address,
      payer,
      1,
    )
  }
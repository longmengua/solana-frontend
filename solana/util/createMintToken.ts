import { getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID, createInitializeMintInstruction } from "@solana/spl-token";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { StateI } from "../module/components/index";

export const createMintToken = async (p: {
  state: StateI, 
  publicKey: PublicKey, 
  connection: Connection, 
  sendTransaction: WalletContextState['sendTransaction'],
}): Promise<string> => {
  const { 
    publicKey,
    state,
    connection,
    sendTransaction,
  } = p;

  const lamports = await getMinimumBalanceForRentExemptMint(connection);
  const keypair = Keypair.generate();
  const decimals = 9;

  const transaction = new Transaction().add(
      SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: keypair.publicKey,
          space: MINT_SIZE,
          lamports: lamports,
          programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        keypair.publicKey, 
        decimals, 
        publicKey, 
        publicKey, 
        TOKEN_PROGRAM_ID,
      )
  );

  const signature = await sendTransaction(transaction, connection, {signers: [keypair]});

  await connection.confirmTransaction(signature);

  return keypair.publicKey.toBase58();
}
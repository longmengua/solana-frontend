import * as anchor from '@project-serum/anchor';
import { Idl, Program, AnchorProvider } from '@project-serum/anchor';
import {ConfirmOptions, Connection, PublicKey} from "@solana/web3.js";
import {AnchorWallet} from "@solana/wallet-adapter-react";
import {
  getAccount, TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
export const NFT_EXCHANGE_PROGRAM_IDL = require(`./idl/nft_exchange.json`);
import {toPublicKey} from "./helper";

const SOLCHICK_NFT_EXCHANGE_PROGRAM_ID = '3aVJtfRnDJqdAxtxu9VE1arfjPSpkrKwAvzBxfgQBodE'; // for dev
// const SOLCHICK_NFT_EXCHANGE_PROGRAM_ID = 'FmxWd8tXXW12kUQmgZ6cbd9AP4otQx44A5YzRGk3cZPy'; // for live

const EXCHANGE_PDA_SEED = `exchange`;
const LOCKED_PDA_SEED = `locked`;

const programId = toPublicKey(SOLCHICK_NFT_EXCHANGE_PROGRAM_ID);

async function getAnchorProvider(connection: Connection, wallet: AnchorWallet) {
  const opts = {
    preflightCommitment: `confirmed`,
  };
  return new AnchorProvider(
    connection,
    wallet,
    opts.preflightCommitment as unknown as ConfirmOptions,
  );
}

export async function lockNft(connection: Connection, wallet: AnchorWallet, nftAccount: PublicKey) {
  const provider = await getAnchorProvider(connection, wallet);
  const programIdl = NFT_EXCHANGE_PROGRAM_IDL;
  if (!provider) {
    return;
  }

  const program = new Program(
    programIdl as unknown as Idl,
    programId,
    provider,
  );

  // todo fetch token Account;
  const tokenAccount = await getAccount(connection, nftAccount);
  const nftAddress = tokenAccount.mint;

  const [exchangePubkey, exchangeBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [
        nftAddress.toBuffer(),
        Buffer.from(anchor.utils.bytes.utf8.encode(EXCHANGE_PDA_SEED)),
      ],
      programId,
    );

  const [lockedNftAccountPubkey, lockedNftAccountNonce] =
    await anchor.web3.PublicKey.findProgramAddress(
      [
        nftAddress.toBuffer(),
        Buffer.from(anchor.utils.bytes.utf8.encode(LOCKED_PDA_SEED)),
      ],
      programId,
    );

  const [configKey, configNonce] = await PublicKey.findProgramAddress(
    [Buffer.from(EXCHANGE_PDA_SEED)],
    programId,
  );

  console.log(`nftTokenAccount`, nftAccount.toString());
  console.log(`nftAddress`, nftAddress.toString());
  console.log(`exchangePubkey`, exchangePubkey.toString());
  console.log(`configKey`, configKey.toString());
  console.log(`lockedNftAccountPubkey`, lockedNftAccountPubkey.toString());

  try {
    const txId = await program.methods.lock(
      configNonce,
      exchangeBump,
      lockedNftAccountNonce,
    ).accounts({
      signer: provider.wallet.publicKey,
      nftAccount: toPublicKey(nftAccount),
      nftMint: nftAddress,
      exchangeAccount: exchangePubkey,
      configuration: configKey,
      lockedNftTokenAccount: lockedNftAccountPubkey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    }).rpc();
    return { success: true, tx_id: txId }
  } catch (e) {
    console.error(e)
    return { success: false }
  }
}
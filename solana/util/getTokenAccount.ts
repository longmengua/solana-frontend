import { getAccount, TokenAccountNotFoundError, TokenInvalidAccountOwnerError, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, TokenInvalidMintError, TokenInvalidOwnerError, getAssociatedTokenAddress, Account } from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, Keypair, PublicKey, SignatureResult, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js";

export const getTokenAccount = async (p: {
  connection: Connection, 
  mint: PublicKey, 
  owner: PublicKey,
  payer: PublicKey,
  sendTransaction: WalletContextState['sendTransaction'],
}): Promise<Account> => {
    const {
      mint,
      owner,
      connection,
      payer,
      sendTransaction,
    } = p;

    const associatedToken = await getAssociatedTokenAddress(
      mint,
      owner,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    // This is the optimal logic, considering TX fee, client-side computation, RPC roundtrips and guaranteed idempotent.
    // Sadly we can't do this atomically.
    let account: Account;
    try {
        account = await getAccount(connection, associatedToken);
    } catch (error: unknown) {
        // TokenAccountNotFoundError can be possible if the associated address has already received some lamports,
        // becoming a system account. Assuming program derived addressing is safe, this is the only case for the
        // TokenInvalidAccountOwnerError in this code path.
        if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
            // As this isn't atomic, it's possible others can create associated accounts meanwhile.
            try {
                const keys = [
                    { pubkey: payer, isSigner: true, isWritable: true },
                    { pubkey: associatedToken, isSigner: false, isWritable: true },
                    { pubkey: owner, isSigner: false, isWritable: false },
                    { pubkey: mint, isSigner: false, isWritable: false },
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
                ];

                const transaction = new Transaction().add(
                    new TransactionInstruction({
                        keys,
                        programId: ASSOCIATED_TOKEN_PROGRAM_ID,
                        data: Buffer.alloc(0),
                    })
                );

                await connection.confirmTransaction(await sendTransaction(transaction, connection));
            } catch (error: unknown) {
                // Ignore all errors; for now there is no API-compatible way to selectively ignore the expected
                // instruction error if the associated account exists already.
            }
            // Now this should always succeed
            account = await getAccount(connection, associatedToken);
        } else {
            throw error;
        }
    }

    if (!account.mint.equals(mint)) throw new TokenInvalidMintError();
    if (!account.owner.equals(owner)) throw new TokenInvalidOwnerError();

    return account;
}
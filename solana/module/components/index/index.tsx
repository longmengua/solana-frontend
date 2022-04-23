import scss from './index.module.scss'

import bs58 from 'bs58'
import { WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { WalletNotConnectedError } from '@solana/wallet-adapter-base'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AccountInfo, Keypair, PublicKey, SystemProgram, Transaction, Connection, clusterApiUrl, TransactionInstruction, AccountMeta } from '@solana/web3.js'
import { createInitializeMintInstruction, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID, getAccount, createMintToInstruction, mintToInstructionData, TokenInstruction, createMint, getMint, Mint, mintTo, getOrCreateAssociatedTokenAccount, transfer } from '@solana/spl-token'

interface StateI {
  receiver: string,
  amountToSend: number,
  lamportDecimal: number,
  mintToken: string | undefined,
  balance: number,
  mintTokenInfo: Mint | undefined,
  nftMetadata: any,
}

export const Index = () => {
  const connection = useMemo(() => new Connection(clusterApiUrl('testnet'), 'confirmed'), []);
  const { publicKey, sendTransaction } = useWallet();
  const [state, setState] = useState<StateI>({
    receiver: 'DYVrQ1W2L1njN9irucgZjW95BXPGbiuXw217JpUUsAiY',
    balance: 0,
    amountToSend: 1,
    lamportDecimal: 9,
    mintToken: '8qqVEBWSJrLUphTSu6CYTtoP3sEjsJXBxqVbmS4atAS5',
    mintTokenInfo: undefined,
    nftMetadata: undefined,
  })

  const transferSol = useCallback(async (state: StateI) => {
      if (!publicKey) throw new WalletNotConnectedError();

      const transaction = new Transaction().add(
          SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: new PublicKey(state.receiver),
              lamports: state.amountToSend * 10 ** state.lamportDecimal,
          })
      );

      const signature = await sendTransaction(transaction, connection);

      await connection.confirmTransaction(signature);

      
  }, [publicKey, sendTransaction, connection]);

  const inputLamport = (lamports: number) => setState(pre => ({...pre, amountToSend: lamports}))

  const inputReceiver = (receiver: string) => setState(pre => ({...pre, receiver}))

  const createToken = async (state: StateI) => {
    if (!publicKey) throw new WalletNotConnectedError();

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

    const signature = await sendTransaction(transaction, connection);

    await connection.confirmTransaction(signature);

    setState(pre => ({...pre, mintToken: keypair.publicKey.toBase58()}))
  }

  const mintToken = async (state: StateI) => {
    if (!publicKey) throw new WalletNotConnectedError();

    const mintTokenAddress: PublicKey =  new PublicKey(state.mintToken || '');
    const destination: PublicKey = new PublicKey(state.receiver);
    const authorityPublicKey: PublicKey = publicKey;
    const amount = state.amountToSend;

    const keys: Array<AccountMeta> = [
      { pubkey: mintTokenAddress, isSigner: false, isWritable: true },
      { pubkey: new PublicKey(state.receiver), isSigner: false, isWritable: true },
      { pubkey: publicKey, isSigner: true, isWritable: false }
    ];

    const data = Buffer.alloc(mintToInstructionData.span);
    mintToInstructionData.encode(
        {
            instruction: TokenInstruction.MintTo,
            amount: BigInt(amount),
        },
        data
    );

    const transaction = new Transaction().add(
      new TransactionInstruction({ keys, programId: TOKEN_PROGRAM_ID, data })
    );

    const signature = await sendTransaction(transaction, connection);

    await connection.confirmTransaction(signature);
  }

  const createToken2 = async () => {
    if (!publicKey) throw new WalletNotConnectedError();

    // '5G5P5sPz77rbszLfXZPvsAch3VJvB1TzcWZKZzpJFuFSuVZWRLbQKMAXTKKoz3XhJ12ETCkrqR1aiVy9n1xDfNhL'
    const secretKey: Uint8Array = Uint8Array.from(bs58.decode('5G5P5sPz77rbszLfXZPvsAch3VJvB1TzcWZKZzpJFuFSuVZWRLbQKMAXTKKoz3XhJ12ETCkrqR1aiVy9n1xDfNhL'))
    const payer = Keypair.fromSecretKey(secretKey);

    const mint = await createMint(
      connection,
      payer,
      publicKey,
      publicKey,
      9,
    );

    setState(pre => ({...pre, mintToken: mint.toBase58()}))
  }

  const mintToken2 = async () => {
    if(!state.mintToken || !publicKey) throw new Error('missing token address');

    // '5G5P5sPz77rbszLfXZPvsAch3VJvB1TzcWZKZzpJFuFSuVZWRLbQKMAXTKKoz3XhJ12ETCkrqR1aiVy9n1xDfNhL'
    const secretKey: Uint8Array = Uint8Array.from(bs58.decode('5G5P5sPz77rbszLfXZPvsAch3VJvB1TzcWZKZzpJFuFSuVZWRLbQKMAXTKKoz3XhJ12ETCkrqR1aiVy9n1xDfNhL'))
    const payer = Keypair.fromSecretKey(secretKey);

    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      new PublicKey(state.mintToken),
      payer.publicKey
    )

    await mintTo(
      connection,
      payer,
      new PublicKey(state.mintToken),
      tokenAccount.address,
      new PublicKey(state.receiver),
      state.amountToSend,
      []
    )
  }

  const mintNFTToken = async () => {

  }

  const transferNFTToken = async () => {
    
  }

  const transferMintToken = async () => {
    if(!state.mintToken || !publicKey) throw new Error('missing token address');

    const results = await PublicKey.findProgramAddress(
      [
        publicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        new PublicKey(state.mintToken).toBuffer(),
      ],
      TOKEN_PROGRAM_ID,
    );
    console.log('result', results)
    debugger;
  }

  const transferNFTToken2 = async () => {
    
  }

  const transferMintToken2 = async () => {
    if(!state.mintToken || !publicKey) throw new Error('missing token address');

    // '5G5P5sPz77rbszLfXZPvsAch3VJvB1TzcWZKZzpJFuFSuVZWRLbQKMAXTKKoz3XhJ12ETCkrqR1aiVy9n1xDfNhL'
    const secretKey: Uint8Array = Uint8Array.from(bs58.decode('5G5P5sPz77rbszLfXZPvsAch3VJvB1TzcWZKZzpJFuFSuVZWRLbQKMAXTKKoz3XhJ12ETCkrqR1aiVy9n1xDfNhL'))
    const fromWallet = Keypair.fromSecretKey(secretKey);

    const mint = new PublicKey(state.mintToken);

    // Get the token account of the fromWallet address, and if it does not exist, create it
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet,
        mint,
        fromWallet.publicKey
    );

    // Get the token account of the toWallet address, and if it does not exist, create it
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, mint, new PublicKey(state.receiver));

    // Transfer the new token to the "toTokenAccount" we just created
    await transfer(
        connection,
        fromWallet,
        fromTokenAccount.address,
        toTokenAccount.address,
        fromWallet.publicKey,
        state.amountToSend,
    );
  }

  const getMetadata = async () => {


  }

  const getSupply = async () => {
    if(!state.mintToken) throw new Error('missing token address')

    const mintInfo: Mint = await getMint(
      connection,
      new PublicKey(state.mintToken),
    )

    setState(pre => ({...pre, mintTokenInfo: mintInfo}))
  }

  const getBalacne = useCallback(async () => {
    if(!publicKey) return 0;
    const balance = await connection.getBalance(publicKey);
    
    setState(pre => ({...pre, balance: balance / 10 ** state.lamportDecimal}))
  }, [publicKey, state.lamportDecimal, connection])

  useEffect(() => {
    getBalacne();
  }, [getBalacne])

  // console.log('state', state);

  return <div className={scss.Index}>
    <div style={{display: 'flex', gap: '10px'}}>
      <div className={scss.connect_button}>
        <WalletMultiButton />
      </div>
      <div style={{width: '100%', display: 'flex', flexDirection: 'column'}}>
        <WalletDisconnectButton className={scss.button}/>
      </div>
    </div>
    <div className={scss.gap} />
    <div>Wallet</div>
    <div className={scss.wallet}>{publicKey?.toBase58()}</div>
    <div className={scss.gap} />
    <div>Lamports</div>
    <div className={scss.wallet}>{state.balance} Sol</div>
    <div className={scss.gap} />
    <div>Mint Token</div>
    <div className={scss.wallet}>{state.mintToken || '-'}</div>
    <div className={scss.gap} />
    <div>Mint Token Info</div>
    <ul>
      <li>address: <>{state.mintTokenInfo?.address?.toBase58()}</></li>
      <li>decimals: <>{state.mintTokenInfo?.decimals}</></li>
      <li>freezeAuthority: <>{state.mintTokenInfo?.freezeAuthority?.toBase58()}</></li>
      <li>mintAuthority: <>{state.mintTokenInfo?.mintAuthority?.toBase58()}</></li>
      <li>supply: <>{state.mintTokenInfo?.supply?.toString()}</></li>
      <li>isInitialized: <>{JSON.stringify(state.mintTokenInfo?.isInitialized)}</></li>
    </ul>
    <div className={scss.gap} />
    <div>Receiver</div>
    <input placeholder='receiver' className={scss.input} type={'text'} value={state.receiver} onInput={e => inputReceiver(e.target.value)}/>
    <div className={scss.gap} />
    <div>Lamports</div>
    <input placeholder='lamports' className={scss.input} type={'text'} value={state.amountToSend} onInput={e => inputLamport(e.target.value)}/>
    <div className={scss.gap} />
    <div style={{ display: 'flex', gap: '5px', flexWrap:'wrap'}}>
      <button disabled={!publicKey} className={scss.button} onClick={() => transferSol(state)}>Transfer Sol</button>
      <button className={scss.button} onClick={() => createToken(state)}>Create mint token</button>
      <button className={scss.button} onClick={() => mintToken(state)}>Mint token</button>
      <button className={scss.button} onClick={() => mintNFTToken()}>Mint NFT Token</button>
      <hr />
      <button className={scss.button} onClick={() => getSupply()}>Get Mint Token Info</button>
      <button className={scss.button} onClick={() => getMetadata()}>Get NFT Token Info</button>
      <button className={scss.button} onClick={() => transferMintToken()}>Transfer mint token</button>
      <button className={scss.button} onClick={() => transferNFTToken()}>Transfer NFT token</button>
      <hr />
      <button className={scss.button} onClick={() => createToken2()}>Create mint token 2</button>
      <button className={scss.button} onClick={() => mintToken2()}>Mint token 2</button>
      <button className={scss.button} onClick={() => mintNFTToken()}>Mint NFT Token2</button>
      <button className={scss.button} onClick={() => transferMintToken2()}>Transfer mint token2</button>
    </div>
  </div>
}

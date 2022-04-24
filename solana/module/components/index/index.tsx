import scss from './index.module.scss'

import bs58 from 'bs58'
import { WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { WalletNotConnectedError } from '@solana/wallet-adapter-base'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AccountInfo, Keypair, PublicKey, SystemProgram, Transaction, Connection, clusterApiUrl, TransactionInstruction, AccountMeta, sendAndConfirmTransaction, TokenAmount, RpcResponseAndContext } from '@solana/web3.js'
import { createInitializeMintInstruction, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID, getAccount, createMintToInstruction, mintToInstructionData, TokenInstruction, createMint, getMint, Mint, mintTo, getOrCreateAssociatedTokenAccount, transfer, createTransferCheckedInstruction, mintToCheckedInstructionData, createMintToCheckedInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TokenAccountNotFoundError, TokenInvalidAccountOwnerError, TokenInvalidMintError, TokenInvalidOwnerError, ASSOCIATED_TOKEN_PROGRAM_ID, Account } from '@solana/spl-token'
import { getTokenAccount } from '../../../util/getTokenAccount'

interface StateI {
  receiver: string,
  amountToSend: number,
  lamportDecimal: number,
  mintToken: string | undefined,
  balance: number,
  tokenBalance: TokenAmount | undefined,
  mintTokenInfo: Mint | undefined,
  nftMetadata: any,
}

export const Index = () => {
  const connection = useMemo(() => new Connection(clusterApiUrl('testnet'), 'confirmed'), []);
  const { publicKey, sendTransaction, signTransaction, wallet } = useWallet();
  const [state, setState] = useState<StateI>({
    mintToken: '2fs4QpMjbFv1m9rzADwwp2tzKonPnSJB69U4XGjut27T',
    receiver: '',
    balance: 0,
    amountToSend: 1,
    lamportDecimal: 9,
    tokenBalance: undefined,
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

    const signature = await sendTransaction(transaction, connection, {signers: [keypair]});

    await connection.confirmTransaction(signature);

    setState(pre => ({...pre, mintToken: keypair.publicKey.toBase58()}))
  }

  const mintToken = async () => {
    if(!state.mintToken || !publicKey) throw new Error('missing token address');

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
      createMintToCheckedInstruction(
        mint,
        ATAto.address,
        publicKey,
        state.amountToSend * (10 ** 9),
        9,
      )
    );

    const signature = await sendTransaction(transaction, connection)

    connection.confirmTransaction(signature);
  }


  const mintNFTToken = async () => {

  }

  const transferNFTToken = async () => {
    
  }

  const transferMintToken = async () => {
    if (!publicKey || !state.mintToken) throw new WalletNotConnectedError();

    const mint: PublicKey =  new PublicKey(state.mintToken || '');
    const receiver: PublicKey = new PublicKey(state.receiver);
    const authorityPublicKey: PublicKey = publicKey;
    const amount = state.amountToSend;

    const ATAfrom = await getTokenAccount({
      connection,
      mint,
      owner: publicKey,
      payer: publicKey,
      sendTransaction,
    });

    const ATAto = await getTokenAccount({
      connection,
      mint,
      owner: receiver,
      payer: publicKey,
      sendTransaction,
    });

    const transaction = new Transaction().add(
      createTransferCheckedInstruction(
        ATAfrom.address,
        mint,
        ATAto.address,
        authorityPublicKey,
        amount,
        9
      )
    )

    connection.confirmTransaction(await sendTransaction(transaction, connection));
  }

  const getMetadata = async () => {

  }

  const getSupply = async () => {
    if(!state.mintToken) throw new Error('missing token address')

    const mint = new PublicKey(state.mintToken)
    const mintInfo: Mint = await getMint(
      connection,
      mint,
    )
 
    let tokenBalance: TokenAmount
    if(publicKey){
      const ATA = await getTokenAccount({
        connection,
        mint,
        owner: publicKey,
        payer: publicKey,
        sendTransaction,
      });
      const result: RpcResponseAndContext<TokenAmount> = await connection.getTokenAccountBalance(ATA.address)
      tokenBalance = result.value;
      // console.log('tokenBalance', tokenBalance);
    }

    setState(pre => ({...pre, mintTokenInfo: mintInfo, tokenBalance}))
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
    <div>Mint token balance</div>
    <div className={scss.wallet}>{state.tokenBalance?.uiAmountString}</div>
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
      <li>supply: <>{state.mintTokenInfo ? (state.mintTokenInfo?.supply / BigInt(10 ** 9))?.toString() || '0' : ''}</></li>
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
      <button className={scss.button} onClick={() => mintToken()}>Mint token</button>
      <button className={scss.button} onClick={() => mintNFTToken()}>Mint NFT Token</button>
      <hr />
      <button className={scss.button} onClick={() => getSupply()}>Get Mint Token Info</button>
      <button className={scss.button} onClick={() => getMetadata()}>Get NFT Token Info</button>
      <button className={scss.button} onClick={() => transferMintToken()}>Transfer mint token</button>
      <button className={scss.button} onClick={() => transferNFTToken()}>Transfer NFT token</button>
    </div>
  </div>
}

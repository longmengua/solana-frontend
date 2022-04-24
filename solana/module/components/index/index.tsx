import scss from './index.module.scss'

import bs58 from 'bs58'
import { WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { WalletNotConnectedError } from '@solana/wallet-adapter-base'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AccountInfo, Keypair, PublicKey, SystemProgram, Transaction, Connection, clusterApiUrl, TransactionInstruction, AccountMeta, sendAndConfirmTransaction, TokenAmount, RpcResponseAndContext, ParsedAccountData, Version } from '@solana/web3.js'
import { createInitializeMintInstruction, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID, getAccount, createMintToInstruction, mintToInstructionData, TokenInstruction, createMint, getMint, Mint, mintTo, getOrCreateAssociatedTokenAccount, transfer, createTransferCheckedInstruction, mintToCheckedInstructionData, createMintToCheckedInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TokenAccountNotFoundError, TokenInvalidAccountOwnerError, TokenInvalidMintError, TokenInvalidOwnerError, ASSOCIATED_TOKEN_PROGRAM_ID, Account, createSetAuthorityInstruction, AuthorityType } from '@solana/spl-token'
import { getTokenAccount } from '../../../util/getTokenAccount'
import { createMintToken } from '../../../util/createMintToken'
import { mintingMintToken } from '../../../util/mintingMintToken'
import { getTokenInfo } from '../../../util/getTokenInfo'
import { getTokenBalance } from '../../../util/getTokenBalance'

export interface StateI {
  receiver: string,
  lamportDecimal: number,
  balance: number,
  amountToSend: number,
  nftMetadata: any,
  version: any,
  mintToken: string | undefined,
  tokenBalance: TokenAmount | undefined,
  mintTokenInfo: Mint | undefined,
  nftTokenAddress: string | undefined,
  payerPrivateKey: string | undefined,
}

export const Index = () => {
  // const connection = useMemo(() => new Connection(clusterApiUrl('testnet'), 'confirmed'), []);
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction, wallet } = useWallet();
  const [state, setState] = useState<StateI>({
    mintToken: '',
    receiver: '',
    nftTokenAddress: '',
    payerPrivateKey: '',
    balance: 0,
    lamportDecimal: 9,
    amountToSend: 0,
    tokenBalance: undefined,
    mintTokenInfo: undefined,
    nftMetadata: undefined,
    version: undefined,
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

  const inputAmount = (amount: number) => setState(pre => ({...pre, amountToSend: amount}))
  
  const inputNFTaddress = (address: string) => setState(pre => ({...pre, nftTokenAddress: address}))

  const inputPayerPrivateKey = (key: string) => setState(pre => ({...pre, payerPrivateKey: key}))

  const inputReceiver = (receiver: string) => setState(pre => ({...pre, receiver}))

  const createToken = async () => {
    if (!publicKey) throw new WalletNotConnectedError();
    const address: string = await createMintToken({connection, publicKey, sendTransaction, state});
    setState(pre => ({...pre, mintToken: address}))
  }

  const mintToken = async () => {
    if (!publicKey) throw new WalletNotConnectedError();

    await mintingMintToken({connection, publicKey, sendTransaction, state});
  }


  const mintNFTToken = async () => {

  }

  const transferNFTToken = async () => {
    if (!publicKey || !state.nftTokenAddress) throw new WalletNotConnectedError();

    const nft: PublicKey =  new PublicKey(state.nftTokenAddress || '');
    const receiver: PublicKey = new PublicKey(state.receiver);
    const authorityPublicKey: PublicKey = publicKey;

    const ATAfrom = await getTokenAccount({
      connection,
      mint: nft,
      owner: publicKey,
      payer: publicKey,
      sendTransaction,
    });

    const ATAto = await getTokenAccount({
      connection,
      mint: nft,
      owner: receiver,
      payer: publicKey,
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
        authorityPublicKey,
        1,
        0,
      )
    )

    connection.confirmTransaction(await sendTransaction(transaction, connection));
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

  /************************************************************************************/
  
  const transferNFTwithPayer = async () => {
    if(!state.payerPrivateKey) throw new Error('missing private key');

    const secretKey: Uint8Array = Uint8Array.from(bs58.decode(state.payerPrivateKey))
    const payer = Keypair.fromSecretKey(secretKey);    
    const nft: PublicKey =  new PublicKey(state.nftTokenAddress || '');
    const receiver: PublicKey = new PublicKey(state.receiver); 

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
      receiver,
    )

    debugger;

    transfer(
      connection,
      payer,
      ATAfrom.address,
      ATAto.address,
      payer,
      1,
    )

    // const transaction = new Transaction().add(
    //   createTransferCheckedInstruction(
    //     ATAfrom.address,
    //     nft,
    //     ATAto.address,
    //     payer.publicKey,
    //     1,
    //     0,
    //   )
    // )

    // connection.sendTransaction(transaction, [payer, receiver1]);
  }

  /************************************************************************************/

  const getMetadata = async () => {
    if (!publicKey) throw new WalletNotConnectedError();

    const seed = 'metadata';
    const nftTokenAddress = 'YYNd7xcEAJumWghGf5UVqzgwefARYST5UDYM6mUsrZN';
    const metaplexAddress = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';

    const [PDA] = await PublicKey.findProgramAddress(
      [Buffer.from(seed), new PublicKey(metaplexAddress).toBuffer(), new PublicKey(nftTokenAddress).toBuffer()],
      new PublicKey(metaplexAddress),
    );

    const nftMeta = await connection.getAccountInfo(PDA);
    if(!nftMeta?.data?.buffer) throw new Error('missing data')
    const data = Buffer.from(nftMeta?.data?.buffer)
  
    console.log('nftMeta', data.toString())
  }

  const getSupply = async () => {
    if(!state.mintToken) throw new Error('missing token address')

    const mintInfo: Mint = await getTokenInfo({connection, sendTransaction, state});
 
    let tokenBalance: TokenAmount | undefined = undefined;
    
    if(publicKey){
      tokenBalance = await getTokenBalance({connection, publicKey, sendTransaction, state});
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
    <div className={scss.wallet}>{state.tokenBalance?.uiAmountString || '-'}</div>
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
    <div>Amount</div>
    <input placeholder='amount' className={scss.input} type={'text'} value={state.amountToSend} onInput={e => inputAmount(e.target.value)}/>
    <div className={scss.gap} />
    <div>NFT token address</div>
    <input placeholder='NFT token address' className={scss.input} type={'text'} value={state.nftTokenAddress} onInput={e => inputNFTaddress(e.target.value)}/>
    <div className={scss.gap} />
    <div>Payer private key</div>
    <input placeholder='Payer private key' className={scss.input} type={'text'} value={state.payerPrivateKey} onInput={e => inputPayerPrivateKey(e.target.value)}/>
    <div className={scss.gap} />
    <div style={{ display: 'flex', gap: '5px', flexWrap:'wrap'}}>
      <button disabled={!publicKey} className={scss.button} onClick={() => transferSol(state)}>Transfer Sol</button>
      <button className={scss.button} onClick={() => transferMintToken()}>Transfer mint token</button>
      <button className={scss.button} onClick={() => transferNFTToken()}>Transfer NFT token</button>
    </div>
    <div className={scss.gap} />
    <div style={{ display: 'flex', gap: '5px', flexWrap:'wrap'}}>
      <button className={scss.button} onClick={() => getSupply()}>Get Mint Token Info</button>
      <button className={scss.button} onClick={() => getMetadata()}>Get NFT Token Info</button>
    </div>
    <div className={scss.gap} />
    <div style={{ display: 'flex', gap: '5px', flexWrap:'wrap'}}>
      <button className={scss.button} onClick={() => createToken()}>Create mint token</button>
      <button className={scss.button} onClick={() => mintToken()}>Mint token</button>
      <button className={scss.button} onClick={() => mintNFTToken()}>Mint NFT Token</button>
    </div>
    <div className={scss.gap} />
    <div style={{ display: 'flex', gap: '5px', flexWrap:'wrap'}}>
      <button className={scss.button} onClick={() => transferNFTwithPayer()}>Transfer NFT with payer</button>
    </div>
  </div>
}

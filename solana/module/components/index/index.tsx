import scss from './index.module.scss'

import { WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { WalletNotConnectedError } from '@solana/wallet-adapter-base'
import { AnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PublicKey, Transaction, TokenAmount, Connection, clusterApiUrl, Cluster} from '@solana/web3.js'
import { getTokenAccount } from '../../../util/getTokenAccount'
import { createMintToken } from '../../../util/createMintToken'
import { mintingMintToken } from '../../../util/mintingMintToken'
import { getTokenInfo } from '../../../util/getTokenInfo'
import { getTokenBalance } from '../../../util/getTokenBalance'
import { lockNft } from '../../../util/lockNFT'
import { unlockNFT } from '../../../util/unlockNFT'
import { transferSol } from '../../../util/transferSol'
import { transferNFT } from '../../../util/transferNFT'
import { transferNFTwithPrivateKey } from '../../../util/transferNFTwithPrivateKey'
import { Metadata } from '@metaplex-foundation/mpl-token-metadata'
import { Mint, getAssociatedTokenAddress, createTransferCheckedInstruction } from '@solana/spl-token'
import ReactJson from 'react-json-view'
import { burnMintToken } from '../../../util/burnToken'
import { getBurntTokenBalance } from '../../../util/getBurntTokenBalance'

export interface StateI {
  receiver: string,
  lamportDecimal: number,
  balance: number,
  amountToSend: number,
  nftMetadata: any,
  version: any,
  mintToken: string | undefined,
  tokenBalance: TokenAmount | undefined,
  tokenBurntBalance: TokenAmount | undefined,
  mintTokenInfo: Mint | undefined,
  nftTokenAddress: string | undefined,
  payerPrivateKey: string | undefined,
}

const publickeyCatch: Record<string, PublicKey> = {}

export const NETWROK: Array<Cluster> = ['devnet', 'testnet', 'mainnet-beta']

export const Index = () => {
  const connection = useMemo(() => new Connection(clusterApiUrl(NETWROK[1]), 'confirmed'), []);
  const { publicKey, sendTransaction, signTransaction, signAllTransactions } = useWallet();
  const [state, setState] = useState<StateI>({
    mintToken: '9rJNcznp8UeEoapY2gRyetmHKkTDfXnNqZqfs8P9dSeY',
    receiver: '',
    nftTokenAddress: 'FGFYyen81fGystmGM5MP9LsWVuzCv55sj3zEnN7ReB25',
    payerPrivateKey: '',
    balance: 0,
    lamportDecimal: 9,
    amountToSend: 0,
    tokenBalance: undefined,
    tokenBurntBalance: undefined,
    mintTokenInfo: undefined,
    nftMetadata: undefined,
    version: undefined,
  })

  // *****************************************************************************************

  const inputAmount = (amount: number) => setState(pre => ({...pre, amountToSend: amount}))
  
  const inputNFTaddress = (address: string) => setState(pre => ({...pre, nftTokenAddress: address}))

  const inputPayerPrivateKey = (key: string) => setState(pre => ({...pre, payerPrivateKey: key}))

  const inputReceiver = (receiver: string) => setState(pre => ({...pre, receiver}))

  // *****************************************************************************************

  const transferS = useCallback(async (state: StateI) => {
      if (!publicKey) throw new WalletNotConnectedError();

      let toPubkey = publickeyCatch[state.receiver];
      let fromPubkey = publicKey;

      if(!toPubkey) {
        toPubkey = new PublicKey(state.receiver);
        publickeyCatch[state.receiver] = toPubkey;
      }

      await transferSol({
        connection,
        fromPubkey: fromPubkey,
        toPubkey: toPubkey,
        sendTransaction,
        lamports: state.amountToSend * 10 ** state.lamportDecimal, 
      });
  }, [publicKey, sendTransaction, connection]);

  const createToken = async () => {
    if (!publicKey) throw new WalletNotConnectedError();
    const address: string = await createMintToken({connection, publicKey, sendTransaction, state});
    setState(pre => ({...pre, mintToken: address}))
  }

  const mintToken = async () => {
    if (!publicKey) throw new WalletNotConnectedError();
    await mintingMintToken({connection, publicKey, sendTransaction, state});
  }

  const burnToken = async () => {
    if (!publicKey) throw new WalletNotConnectedError();
    await burnMintToken({connection, publicKey, sendTransaction, state});
  }

  const lockNFTToken = async () => {
    if (!publicKey || !state.nftTokenAddress || !signTransaction || !signAllTransactions) throw new WalletNotConnectedError();

    const nft: PublicKey =  new PublicKey(state.nftTokenAddress || '');
    const anchorWallet: AnchorWallet = {
      publicKey: publicKey,
      signTransaction,
      signAllTransactions,
    };

    const ATAfrom = await getAssociatedTokenAddress(nft, publicKey);

    const result = await lockNft(connection, anchorWallet, ATAfrom, nft);
    console.log('lockNFTToken', result);
  }

  const unlockNFTToken = async () => {
    if (!publicKey || !state.nftTokenAddress || !signTransaction || !signAllTransactions) throw new WalletNotConnectedError();

    const nft: PublicKey =  new PublicKey(state.nftTokenAddress || '');
    const anchorWallet: AnchorWallet = {
      publicKey: publicKey,
      signTransaction,
      signAllTransactions,
    };

    const ATAfrom = await getAssociatedTokenAddress(nft, publicKey);

    const result = await unlockNFT(connection, anchorWallet, ATAfrom, nft);
    console.log('unlockNFTToken', result);
  }

  const mintNFTToken = async () => {

  }

  const transferNFTToken = async () => {
    if (!publicKey || !state.nftTokenAddress) throw new WalletNotConnectedError();

    const nft: PublicKey =  new PublicKey(state.nftTokenAddress || '');
    const receiver: PublicKey = new PublicKey(state.receiver);

    transferNFT({
      from: publicKey,
      nft: nft,
      to: receiver,
      sendTransaction: sendTransaction,
      connection: connection,
    })
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
  
  const transferNFTwithPayer = async () => {
    if(!state.payerPrivateKey) throw new Error('missing private key');
    if(!state.nftTokenAddress) throw new Error('missing nft token address');
    transferNFTwithPrivateKey({
      privateKey: state.payerPrivateKey,
      nftTokenAddress: state.nftTokenAddress,
      receiver: state.receiver,
      connection,
      sendTransaction,
    })
  }

  const getNFTMetadataV2 = async () => {
    if(!state.nftTokenAddress) throw new Error('missing nft token address');
    let metadataPDA = await Metadata.getPDA(new PublicKey(state.nftTokenAddress));
    const tokenmeta = await Metadata.load(connection, metadataPDA);
    // console.log('connection', connection);
    // console.log('metadataPDA', metadataPDA.toBase58());
    // console.log('tokenmeta', tokenmeta);
    setState(pre => ({...pre, nftMetadata: tokenmeta}))
  }

  const getSupply = async () => {
    if(!state.mintToken) throw new Error('missing token address')

    const mintInfo: Mint = await getTokenInfo({connection, sendTransaction, state});
 
    let tokenBalance: TokenAmount | undefined = undefined;
    let tokenBurntBalance: TokenAmount | undefined = undefined;

    console.log('mintInfo', mintInfo);
    
    if(publicKey){
      tokenBalance = await getTokenBalance({connection, publicKey, sendTransaction, state});
      tokenBurntBalance = await getBurntTokenBalance({connection, publicKey, sendTransaction, state});
    }

    setState(pre => ({...pre, mintTokenInfo: mintInfo, tokenBalance, tokenBurntBalance}))
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
      <button disabled={!publicKey} className={scss.button} onClick={() => transferS(state)}>Transfer Sol</button>
      <button className={scss.button} onClick={() => transferMintToken()}>Transfer mint token</button>
      <button className={scss.button} onClick={() => transferNFTToken()}>Transfer NFT token</button>
      <button className={scss.button} onClick={() => lockNFTToken()}>Lock NFT token</button>
      <button className={scss.button} onClick={() => unlockNFTToken()}>Unlock NFT token</button>
    </div>
    <div className={scss.gap} />
    <div style={{ display: 'flex', gap: '5px', flexWrap:'wrap'}}>
      <button className={scss.button} onClick={() => getSupply()}>Get Mint Token Info</button>
      <button className={scss.button} onClick={() => getNFTMetadataV2()}>Get NFT Token Info</button>
    </div>
    <div className={scss.gap} />
    <div style={{ display: 'flex', gap: '5px', flexWrap:'wrap'}}>
      <button className={scss.button} onClick={() => createToken()}>Create mint token</button>
      <button className={scss.button} onClick={() => mintToken()}>Mint token</button>
      <button className={scss.button} onClick={() => burnToken()}>Burn token</button>
      <button className={scss.button} onClick={() => mintNFTToken()}>Mint NFT Token</button>
    </div>
    <div className={scss.gap} />
    <div style={{ display: 'flex', gap: '5px', flexWrap:'wrap'}}>
      <button className={scss.button} onClick={() => transferNFTwithPayer()}>Transfer NFT with payer</button>
      {/* <button className={scss.button} onClick={() => letClientSendTransaction()}>Let Client Send Transaction</button> */}
    </div>

    <div className={scss.gap} />
    <div>Wallet</div>
    <div className={scss.wallet}>{publicKey?.toBase58()}</div>
    <div className={scss.gap} />
    <div>Lamports</div>
    <div className={scss.wallet}>{state.balance} Sol</div>
    <div className={scss.gap} />
    <div>Burnt token balance</div>
    <div className={scss.wallet}>{state.tokenBalance?.uiAmountString || '-'}</div>
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
    <div>NFT MEtadata</div>
    <ul>
      <li>PDA: <>{state.nftMetadata?.pubkey?.toBase58()}</></li>
      <li>
        {JSON.stringify(state.nftMetadata)}
      </li>
    </ul>
  </div>
}

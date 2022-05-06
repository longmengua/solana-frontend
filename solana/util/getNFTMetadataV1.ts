import { publicKey } from "@project-serum/anchor/dist/cjs/utils";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { Connection, PublicKey } from "@solana/web3.js";


export const getNFTMetadataV1 = async (p: {
  connection: Connection,
}) => {
  const { connection } = p;

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
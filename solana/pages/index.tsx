import type { NextPage } from 'next'
import { Index } from '../module/components/index'

const Home: NextPage = () => {
  return <div style={{display: 'flex', justifyContent: 'center'}}>
    <Index />
  </div>
}

export default Home

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-web3"
import "@nomiclabs/hardhat-waffle"
import "hardhat-typechain"

// deployment plugins
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';

// Tools
import "hardhat-gas-reporter"
import "solidity-coverage"

import { HardhatUserConfig } from "hardhat/types"

// import dotenv from 'dotenv'
//dotenv.config()
const PRIVATE_KEY = process.env.PRIVATE_KEY
const INFURA_KEY = process.env.INFURA_KEY

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      { version: "0.8.9", settings: {} }
    ]
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      gas: 12000000,
      allowUnlimitedContractSize: true,
      blockGasLimit: 12000000,
    },
    // mainnet: {
    //   url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
    //   accounts: [`0x${PRIVATE_KEY}`]
    // },
    // rinkeby: {
    //   url: `https://rinkeby.infura.io/v3/${INFURA_KEY}`,
    //   accounts: [`0x${PRIVATE_KEY}`],
    //   allowUnlimitedContractSize: true,
    //   blockGasLimit: 12000000,
    // },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  },
  gasReporter: {
    enabled: (process.env.REPORT_GAS) ? true : false
  }
}

export default config
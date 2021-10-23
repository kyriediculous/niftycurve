import {ethers} from "hardhat"
import chai, {expect, assert} from "chai"
import {solidity} from "ethereum-waffle"
chai.use(solidity)

describe("NiftyCurve", () => {
    let reserveToken: any
    let nft: any
    let niftyCurve: any

    let signers
    let deployer: any

    const reserveSupply = ethers.utils.parseEther("100")
    const initialReserve = ethers.utils.parseEther("10")
    const tokenID = 1337
    const reserveRatio = 500000 // 50%

    before(async () => {
        signers = await ethers.getSigners()
        deployer = signers[0].address
        // deploy an ERC20 and mint some to us
        // will serve as reserve token
        const testTokenFac = await ethers.getContractFactory("TestToken")
        reserveToken = await testTokenFac.deploy("TestToken", "TST", reserveSupply)

        // deploy a NFT contract and mint us a tokenID
        // will serve as the NFT to fractionalize
        const testNFTFac = await ethers.getContractFactory("TestNFT")
        nft = await testNFTFac.deploy("TestNFT", "TNFT")
        await nft.mint(tokenID)
    })

    describe("initialize", () => {
        it("reverts if NFT is a zero address", async () => {
            const curveFac = await ethers.getContractFactory("NiftyCurve")
            await expect(
                curveFac.deploy(
                ethers.constants.AddressZero,
                tokenID,
                reserveToken.address,
                reserveRatio,
                "TestNFTCurve",
                "TNFT"
                )
            ).to.be.revertedWith("INVALID_ERC721")
        })

        it("reverts if reserveToken is a zero address", async () => {
            const curveFac = await ethers.getContractFactory("NiftyCurve")
            await expect(
                curveFac.deploy(
                nft.address,
                tokenID,
                ethers.constants.AddressZero,
                reserveRatio,
                "TestNFTCurve",
                "TNFT"
                )
            ).to.be.revertedWith("INVALID_ERC20")
        })

        it("reverts if reserve ratio is not a valid percentage", async () => {
            const curveFac = await ethers.getContractFactory("NiftyCurve")
            await expect(
                curveFac.deploy(
                nft.address,
                tokenID,
                reserveToken.address,                100000000,
                "TestNFTCurve",
                "TNFT"
                )
            ).to.be.revertedWith("INVALID_RESERVE_RATIO")
        })

        it("deploys a new NiftyCurve", async () => {
            const curveFac = await ethers.getContractFactory("NiftyCurve")
            niftyCurve = await curveFac.deploy(
                nft.address,
                tokenID,
                reserveToken.address,
                reserveRatio,
                "TestNFTCurve",
                "TNFT"
            )

            await reserveToken.approve(niftyCurve.address, initialReserve)
            await nft.approve(niftyCurve.address, tokenID)
            await niftyCurve.start(initialReserve)
            
            expect(await reserveToken.balanceOf(niftyCurve.address)).to.eq(initialReserve)
            expect(await nft.balanceOf(niftyCurve.address)).to.eq(1)
            expect(await nft.ownerOf(tokenID)).to.eq(niftyCurve.address)
            expect(await niftyCurve.nft()).to.eq(nft.address)
            expect(await niftyCurve.tokenID()).to.eq(tokenID)
            expect(await niftyCurve.reserveToken()).to.eq(reserveToken.address)
            expect(await niftyCurve.reserveRatio()).to.eq(reserveRatio)
        })

    })

    describe("buy", () => {
        it("buys more", async () => {
            console.log((await niftyCurve.balanceOf(deployer)).toString())
            await reserveToken.approve(niftyCurve.address, initialReserve)
            await niftyCurve.buy(initialReserve)
            console.log((await niftyCurve.balanceOf(deployer)).toString())
        })
        // We have 90 reserve tokens remaining
        // We own 10 continuous tokens (TODO: double check)
    })

    describe("sell", () => {

    })
})
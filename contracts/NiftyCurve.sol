//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "./libs/MathUtils.sol";
import "./libs/Power.sol";

contract NiftyCurve is Power, ERC20 {

    address constant ZERO_ADDRESS = address(0);
    uint32 constant MAX_RR = 1000000;

    IERC721 public nft;
    uint256 public tokenID;

    IERC20 public reserveToken;

    uint32 public reserveRatio;
    bool started;

    modifier isStarted() {
        require(started, "NOT_STARTED");
        _;
    }

    modifier isNotStarted() {
        require(!started, "ALREADY_STARTED");
        _;
    }

    constructor(IERC721 _nft, uint256 _tokenID, IERC20 _reserveToken, uint32 _reserveRatio, string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        require(address(_nft) != ZERO_ADDRESS, "INVALID_ERC721");
        require(address(_reserveToken) != ZERO_ADDRESS, "INVALID_ERC20");
        require(_reserveRatio <= MAX_RR, "INVALID_RESERVE_RATIO");
        nft = _nft;
        tokenID = _tokenID;
        reserveToken = _reserveToken;
        reserveRatio = _reserveRatio;
    }

    function start(uint256 _reserveAmount) public isNotStarted {
        started = true;
        nft.transferFrom(msg.sender, address(this), tokenID);
        buy(_reserveAmount);
    }

    function buy(uint256 _purchaseAmount) public isStarted returns (uint256) {
        uint256 mintAmount = calcPurchaseAmount(_purchaseAmount);
        reserveToken.transferFrom(msg.sender, address(this), _purchaseAmount);
        _mint(msg.sender, mintAmount);
        return mintAmount;
    }

    function sell(uint256 _saleAmount) public isStarted returns (uint256) {
        uint256 transferAmount = calcSaleAmount(_saleAmount);
        _burn(msg.sender, _saleAmount);
        reserveToken.transfer(msg.sender, transferAmount);
        if (_saleAmount == totalSupply()) {
            nft.transferFrom(address(this), msg.sender, tokenID);
        }
        return transferAmount;
    }

    function exchangeRate() public view returns (uint256) {
        //  ` Continuous Token Price = Reserve Token Balance / (Continuous Token Supply x Reserve Ratio)`
        return MathUtils.percOf(reserveRatio, reserveToken.balanceOf(address(this)), totalSupply());
    }

    function NFT() public view returns (address, uint256) {
        return (address(nft), tokenID);
    }

    function calcPurchaseAmount(uint256 _purchaseAmount) internal view returns (uint256) {
        // continuous token supply
        uint256 cSupply = totalSupply();
        // reserve balance for this contract
        uint256 rBalance = reserveToken.balanceOf(address(this));
        // reserve ratio 
        uint32 rr = reserveRatio;

        if (_purchaseAmount == 0) {
            return 0;
        }

        if (rBalance == 0) {
            return _purchaseAmount;
        }

        if (rr == MAX_RR) {
            return MathUtils.percOf(cSupply, _purchaseAmount, rBalance);
        }

        uint256 baseN = rBalance + _purchaseAmount;
        (uint256 result, uint8 prec) = Power.power(baseN, rBalance, rr, MAX_RR);

        uint256 newSupply = cSupply * result >> prec;
        return newSupply - cSupply;
    }

    function calcSaleAmount(uint256 _saleAmount) internal view returns (uint256) {
        // continuous token supply
        uint256 cSupply = totalSupply();
        // reserve balance for this contract
        uint256 rBalance = reserveToken.balanceOf(address(this));
        // reserve ratio 
        uint32 rr = reserveRatio;

        if (_saleAmount == cSupply) {
            return rBalance;
        }

        if (rr == MAX_RR) {
            return MathUtils.percOf(rBalance, _saleAmount, cSupply);
        }

        uint256 baseD = cSupply - _saleAmount;
        (uint256 result, uint8 prec) = Power.power(cSupply, baseD, MAX_RR, rr);

        uint256 newBalance = rBalance << prec;
        return (rBalance*result - newBalance)/result;
    }
}
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TestNFT is ERC721 {

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function mint(uint256 tokenID) public {
        _safeMint(msg.sender, tokenID);
    }
}
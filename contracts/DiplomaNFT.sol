// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract DiplomaNFT is ERC721 {
    uint256 private _nextTokenId;
    
    address public immutable kahootGame;
    string public gameTokenURI;

    error UnauthorizedGame(address caller);
    error InvalidAddress();

    modifier onlyGame() {
        if (msg.sender != kahootGame) revert UnauthorizedGame(msg.sender);
        _;
    }

    constructor(address _game, string memory _tokenURI) ERC721("Kahoot Web3 Diploma", "KWD") {
        if (_game == address(0)) revert InvalidAddress();
        kahootGame = _game;
        gameTokenURI = _tokenURI;
    }

    function mintDiploma(address to) external onlyGame {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        // ponytail: removed _setTokenURI to save 20,000 gas per mint (SSTORE)
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return gameTokenURI;
    }
}

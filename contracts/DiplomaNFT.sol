// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DiplomaNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    address public kahootGame;
    
    // Almacenamos la address del KahootManager
    address public kahootManager;

    modifier onlyGame() {
        require(msg.sender == kahootGame, "Solo la partida puede mintear");
        _;
    }

    constructor(address initialOwner) ERC721("Kahoot Web3 Diploma", "KWD") Ownable(initialOwner) {
        // Quien despliega este contrato es el KahootGame, así que lo guardamos
        kahootGame = msg.sender; 
    }

    function mintDiploma(address to, string memory tokenURI) external onlyGame {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
    }
}
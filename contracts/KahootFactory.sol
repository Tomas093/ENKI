// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./KahootGame.sol";

contract KahootFactory {
    KahootGame[] public games;

    // ─── Ownership & Fee ──────────────────────────────────────────────────────
    address public owner;
    uint256 public creationFee;



    mapping(address => KahootGame[]) public kahootsDeProfesor;

    event GameCreated(address indexed gameAddress, address indexed professor);

    event CreationFeeUpdated(uint256 oldFee, uint256 newFee);

    modifier onlyOwner() {
        require(msg.sender == owner, "Solo el owner");
        _;
    }

    constructor(uint256 _creationFee) {
        owner = msg.sender;
        creationFee = _creationFee;
    }

    function setCreationFee(uint256 _newFee) external onlyOwner {
        emit CreationFeeUpdated(creationFee, _newFee);
        creationFee = _newFee;
    }

    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Sin fondos");
        (bool ok, ) = owner.call{value: balance}("");
        require(ok, "Transferencia fallida");
    }

    function createGame(
        string calldata _gameName,
        uint256 _passingScore,
        uint256 _totalQuestions,
        string calldata _diplomaTokenURI,
        KahootGame.RondaOculta[] calldata _rondas,
        uint256 _entryFee
    ) external payable returns (address) {
        require(msg.value >= creationFee, "Tarifa de creacion insuficiente");
        KahootGame newGame = new KahootGame(
            address(this),
            msg.sender,
            _gameName,
            _passingScore,
            _totalQuestions,
            _diplomaTokenURI,
            _rondas,
            _entryFee
        );
        games.push(newGame);
        kahootsDeProfesor[msg.sender].push(newGame);

        emit GameCreated(address(newGame), msg.sender);

        return address(newGame);
    }

    function getKahootsDeProfesor(address _profesor) external view returns (KahootGame[] memory) {
        return kahootsDeProfesor[_profesor];
    }



    function getGamesCount() external view returns (uint256) {
        return games.length;
    }
}

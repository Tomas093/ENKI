// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DiplomaNFT.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract KahootGame is ReentrancyGuard {
    // ─── Datos del juego ───────────────────────────────────────────────────────
    address public factory;
    address public professor;
    string public gameName;
    DiplomaNFT public diplomaContract;

    uint256 public passingScore;
    uint256 public totalQuestions;
    uint256 public currentQuestionId;
    mapping(uint256 => uint8) public revealedAnswers;
    bool public isFinished;

    bytes32 public questionsMerkleRoot;

    struct RondaStatus {
        bytes32 hashRespuestaCorrecta; // keccak256(opcionCorrecta + saltProfesor + direccionProfesor)
        bool commitPhaseOpen;
        bool revealPhaseOpen;
    }

    mapping(uint256 => RondaStatus) public rondas;
    mapping(uint256 => mapping(address => bytes32)) public commits;
    mapping(address => uint256) public scores;
    mapping(address => bool) public hasClaimed; // diploma

    // ─── Prize Pool ────────────────────────────────────────────────────────────
    uint256 public entryFee;
    uint256 public prizePool;
    mapping(address => bool) public hasJoined;

    // Seguimiento dinámico: cuántos jugadores tienen cada puntaje posible.
    // Se actualiza en joinGame() y en cada revealAnswer() correcto.
    mapping(uint256 => uint256) public scoreFrequency;

    // Estado post-calculatePrizes
    bool public prizesCalculated;
    uint256[3] public topScoreValues;          // los 3 puntajes más altos distintos
    uint256[3] public topScoreCounts;          // cantidad de jugadores en cada rango
    uint256[3] public prizePerPlayerAtRank;    // wei que recibe cada jugador del rango
    uint256 public professorPrize;             // total del profesor (10% base + sobrantes)

    mapping(address => bool) public hasPrizeClaimed;
    bool public professorPrizeClaimed;

    // ─── Timeout / Circuit Breaker ─────────────────────────────────────────────

    uint256 public lastActionTime;
    bool public isCancelled;
    uint256 public constant INACTIVITY_TIMEOUT = 12 hours;

    // ─── Eventos ───────────────────────────────────────────────────────────────
    event QuestionOpened(uint256 indexed questionId);
    event QuestionRevealed(uint256 indexed questionId, string enunciado, string[4] opciones);
    event RevealPhaseStarted(uint256 indexed questionId);
    event DiplomaClaimed(address indexed student);
    event PlayerJoined(address indexed player, uint256 feePaid);
    event PrizesCalculated(uint256 rank1Score, uint256 rank2Score, uint256 rank3Score);
    event PrizeClaimed(address indexed recipient, uint256 amount);
    event RefundClaimed(address indexed player, uint256 amount);
    event GameCancelledByInactivity(uint256 triggeredAt);

    // ─── Modificadores ─────────────────────────────────────────────────────────
    modifier onlyProfessor() {
        require(msg.sender == professor, "Solo el profe puede ejecutar esto");
        _;
    }

    modifier notCancelled() {
        require(!isCancelled, "El juego fue cancelado por inactividad");
        _;
    }

    // ─── Constructor ───────────────────────────────────────────────────────────
    constructor(
        address _factory,
        address _professor,
        string memory _gameName,
        uint256 _passingScore,
        uint256 _totalQuestions,
        string memory _diplomaTokenURI,
        bytes32 _questionsMerkleRoot,
        uint256 _entryFee
    ) {
        require(_totalQuestions > 0, "Debe tener preguntas");
        require(_passingScore > 0, "Puntaje invalido");
        require(_passingScore <= _totalQuestions, "Puntaje mayor al total");

        factory = _factory;
        professor = _professor;
        gameName = _gameName;
        passingScore = _passingScore;
        totalQuestions = _totalQuestions;
        entryFee = _entryFee;
        questionsMerkleRoot = _questionsMerkleRoot;

        diplomaContract = new DiplomaNFT(address(this), _diplomaTokenURI);
        lastActionTime = block.timestamp;
    }

    // ─── Unirse al juego ───────────────────────────────────────────────────────
    function joinGame() external payable notCancelled {
        require(currentQuestionId == 0 && !rondas[0].commitPhaseOpen, "El juego ya comenzo o ya termino");
        require(!hasJoined[msg.sender], "Ya te uniste al juego");
        require(msg.value == entryFee, "Debes enviar exactamente el entryFee");

        hasJoined[msg.sender] = true;
        prizePool += msg.value;
        // El jugador empieza con score 0; lo registramos en el histograma de frecuencias.
        scoreFrequency[0] += 1;

        emit PlayerJoined(msg.sender, msg.value);
    }

    // ─── Flujo del juego ───────────────────────────────────────────────────────
    function startNextQuestion(
        bytes32 _questionHash,
        bytes32 _correctAnswerHash,
        bytes32[] calldata _merkleProof,
        string calldata _enunciado,
        string[4] calldata _opciones,
        bytes32 _saltPregunta
    ) external onlyProfessor notCancelled {
        require(!isFinished, "El juego termino");

        uint256 currentQ = currentQuestionId;
        if (currentQ > 0) {
            require(
                !rondas[currentQ - 1].commitPhaseOpen && !rondas[currentQ - 1].revealPhaseOpen,
                "Hay una pregunta activa"
            );
        }
        require(currentQ < totalQuestions, "No hay mas preguntas");

        // Verify hash string
        require(
            keccak256(abi.encode(_enunciado, _opciones[0], _opciones[1], _opciones[2], _opciones[3], _saltPregunta)) == _questionHash,
            "El texto modificado o invalido"
        );

        // Verify Merkle Proof
        bytes32 leaf = keccak256(abi.encodePacked(currentQ, _questionHash, _correctAnswerHash));
        require(MerkleProof.verify(_merkleProof, questionsMerkleRoot, leaf), "Merkle proof invalido");

        rondas[currentQ].hashRespuestaCorrecta = _correctAnswerHash;
        rondas[currentQ].commitPhaseOpen = true;
        lastActionTime = block.timestamp; // resetea el reloj de inactividad
        
        emit QuestionOpened(currentQ);
        emit QuestionRevealed(currentQ, _enunciado, _opciones);
    }

    function commitAnswer(bytes32 _commitHash) external {
        require(hasJoined[msg.sender], "Debes unirte primero con joinGame()");
        uint256 currentQ = currentQuestionId;
        require(rondas[currentQ].commitPhaseOpen, "Fase de commit cerrada");
        require(_commitHash != bytes32(0), "Hash nulo");
        require(commits[currentQ][msg.sender] == bytes32(0), "Ya respondiste esta pregunta");

        commits[currentQ][msg.sender] = _commitHash;
    }

    function closeQuestionAndStartReveal(uint8 _correctOption, bytes32 _saltRespuesta) external onlyProfessor notCancelled {
        uint256 currentQ = currentQuestionId;
        require(rondas[currentQ].commitPhaseOpen, "No esta en fase de commit");

        bytes32 generatedHash = keccak256(abi.encodePacked(_correctOption, _saltRespuesta, msg.sender));
        require(generatedHash == rondas[currentQ].hashRespuestaCorrecta, "Hash de respuesta incorrecto");

        revealedAnswers[currentQ] = _correctOption;
        rondas[currentQ].commitPhaseOpen = false;
        rondas[currentQ].revealPhaseOpen = true;
        lastActionTime = block.timestamp;

        emit RevealPhaseStarted(currentQ);
    }
    
    function closeCurrentAndOpenNext(
        uint8 _correctOption, 
        bytes32 _saltRespuesta,
        bytes32 _nextQuestionHash,
        bytes32 _nextCorrectAnswerHash,
        bytes32[] calldata _nextMerkleProof,
        string calldata _enunciado,
        string[4] calldata _opciones,
        bytes32 _saltPregunta
    ) external onlyProfessor notCancelled {
        uint256 currentQ = currentQuestionId;
        require(rondas[currentQ].commitPhaseOpen, "No esta en fase de commit");

        bytes32 generatedHash = keccak256(abi.encodePacked(_correctOption, _saltRespuesta, msg.sender));
        require(generatedHash == rondas[currentQ].hashRespuestaCorrecta, "Hash de respuesta incorrecto");

        revealedAnswers[currentQ] = _correctOption;
        rondas[currentQ].commitPhaseOpen = false;
        rondas[currentQ].revealPhaseOpen = false;
        
        emit RevealPhaseStarted(currentQ);
        
        currentQuestionId += 1;
        uint256 nextQ = currentQuestionId;
        
        require(nextQ < totalQuestions, "No hay mas preguntas");

        // Verify hash string
        require(
            keccak256(abi.encode(_enunciado, _opciones[0], _opciones[1], _opciones[2], _opciones[3], _saltPregunta)) == _nextQuestionHash,
            "El texto modificado o invalido"
        );

        // Verify Merkle Proof for the next question
        bytes32 leaf = keccak256(abi.encodePacked(nextQ, _nextQuestionHash, _nextCorrectAnswerHash));
        require(MerkleProof.verify(_nextMerkleProof, questionsMerkleRoot, leaf), "Merkle proof invalido");

        rondas[nextQ].hashRespuestaCorrecta = _nextCorrectAnswerHash;
        rondas[nextQ].commitPhaseOpen = true;
        lastActionTime = block.timestamp;
        
        emit QuestionOpened(nextQ);
        emit QuestionRevealed(nextQ, _enunciado, _opciones);
    }

    function revealAnswer(uint256 _questionId, uint8 _option, bytes32 _salt) external {
        require(hasJoined[msg.sender], "Debes unirte primero con joinGame()");
        require(rondas[_questionId].revealPhaseOpen, "Fase de reveal cerrada");
        bytes32 storedCommit = commits[_questionId][msg.sender];
        require(storedCommit != bytes32(0), "No hiciste commit en esta pregunta");

        bytes32 generatedHash = keccak256(abi.encodePacked(_option, _salt, msg.sender));
        require(generatedHash == storedCommit, "El hash no coincide con tu commit");

        // Anulamos el commit para evitar doble-reveal
        commits[_questionId][msg.sender] = bytes32(0);

        if (_option == revealedAnswers[_questionId]) {
            // Actualizamos el histograma de frecuencias dinámicamente.
            // Decrementamos el puntaje anterior e incrementamos el nuevo.
            uint256 oldScore = scores[msg.sender];
            scoreFrequency[oldScore] -= 1;
            scores[msg.sender] = oldScore + 1;
            scoreFrequency[oldScore + 1] += 1;
        }
    }


    function batchRevealAnswers(uint256[] calldata _questionIds, uint8[] calldata _options, bytes32[] calldata _salts) external {
        require(hasJoined[msg.sender], "Debes unirte primero con joinGame()");
        require(_questionIds.length == _options.length && _options.length == _salts.length, "Mismatched lengths");
        
        for (uint256 i = 0; i < _questionIds.length; i++) {
            uint256 qId = _questionIds[i];
            require(rondas[qId].revealPhaseOpen || (qId < currentQuestionId) || isFinished, "Fase de reveal cerrada o no es el momento");
            
            bytes32 storedCommit = commits[qId][msg.sender];
            if (storedCommit == bytes32(0)) continue;
            
            bytes32 generatedHash = keccak256(abi.encodePacked(_options[i], _salts[i], msg.sender));
            require(generatedHash == storedCommit, "El hash no coincide con tu commit");
            
            commits[qId][msg.sender] = bytes32(0);
            
            if (_options[i] == revealedAnswers[qId]) {
                uint256 oldScore = scores[msg.sender];
                scoreFrequency[oldScore] -= 1;
                scores[msg.sender] = oldScore + 1;
                scoreFrequency[oldScore + 1] += 1;
            }
        }
    }

    function advanceToNextQuestion() external onlyProfessor notCancelled {
        uint256 currentQ = currentQuestionId;
        require(rondas[currentQ].revealPhaseOpen, "Primero hay que abrir los reveals");

        rondas[currentQ].revealPhaseOpen = false;
        currentQuestionId += 1;
        lastActionTime = block.timestamp;

        if (currentQuestionId == totalQuestions) {
            isFinished = true;
        }
    }

    // ─── Reembolso por inactividad (timeout) ───────────────────────────────────
    function claimRefund() external nonReentrant {
        // ── CHECKS ──────────────────────────────────────────────────────────────
        require(hasJoined[msg.sender], "No participaste en este juego");
        require(!hasPrizeClaimed[msg.sender], "Ya retiraste un premio o reembolso");
        require(
            block.timestamp >= lastActionTime + INACTIVITY_TIMEOUT,
            "El timeout de inactividad aun no vencio"
        );
        require(!isFinished, "El juego ya termino; usa claimPrize()");

        // ── EFFECTS ─────────────────────────────────────────────────────────────
        hasPrizeClaimed[msg.sender] = true;
        prizePool -= entryFee;
        if (!isCancelled) {
            isCancelled = true;
            emit GameCancelledByInactivity(block.timestamp);
        }

        // ── INTERACTIONS ────────────────────────────────────────────────────────
        (bool success, ) = msg.sender.call{value: entryFee}("");
        require(success, "La transferencia de ETH fallo");

        emit RefundClaimed(msg.sender, entryFee);
    }

    // ─── Cálculo de premios ────────────────────────────────────────────────────
    function calculatePrizes() external {
        require(isFinished, "El juego no ha terminado");
        require(!prizesCalculated, "Los premios ya fueron calculados");

        prizesCalculated = true;

        uint256 slotsUsed = 0;
        uint8 ranksFound = 0;
        
        // Pesos base para los 3 primeros puestos (60%, 20%, 10%)
        uint256[3] memory slotWeights = [uint256(60), uint256(20), uint256(10)];
        uint256 totalWeight = 0;

        // PRIMERA PASADA: Identificar grupos, ocupar slots y calcular el peso (weight) de cada grupo.
        // OJO: Se frena si s == 0, por lo que los puntajes de 0 NUNCA reciben premio.
        for (uint256 s = totalQuestions; s > 0 && slotsUsed < 3; s--) {
            uint256 freq = scoreFrequency[s];

            if (freq > 0) {
                uint256 groupWeight = 0;
                
                // Acumulamos el peso para este grupo según los slots que ocupen
                for (uint256 i = 0; i < freq && slotsUsed < 3; i++) {
                    groupWeight += slotWeights[slotsUsed];
                    slotsUsed++;
                }

                if (groupWeight > 0) {
                    topScoreValues[ranksFound] = s;
                    topScoreCounts[ranksFound] = freq;
                    // Guardamos temporalmente el peso del grupo aquí
                    prizePerPlayerAtRank[ranksFound] = groupWeight;
                    totalWeight += groupWeight;
                    ranksFound++;
                }
            }
        }

        // SEGUNDA PASADA: Repartir el 90% del pozo de forma proporcional a los pesos.
        uint256 playerPool = (prizePool * 90) / 100;
        uint256 totalToPlayers = 0;

        if (totalWeight > 0) {
            for (uint8 i = 0; i < ranksFound; i++) {
                uint256 groupWeight = prizePerPlayerAtRank[i];
                uint256 groupPrize = (playerPool * groupWeight) / totalWeight;
                uint256 freq = topScoreCounts[i];
                
                uint256 prizePerPlayer = groupPrize / freq;
                // Reemplazamos el peso temporal por el premio final por jugador
                prizePerPlayerAtRank[i] = prizePerPlayer;
                
                totalToPlayers += prizePerPlayer * freq;
            }
        }

        // El profesor recibe todo lo que sobra (mínimo 10% si se reparte algo, 100% si nadie suma > 0)
        professorPrize = prizePool - totalToPlayers;

        emit PrizesCalculated(
            ranksFound >= 1 ? topScoreValues[0] : 0,
            ranksFound >= 2 ? topScoreValues[1] : 0,
            ranksFound >= 3 ? topScoreValues[2] : 0
        );
    }

    // ─── Retiro de premios ─────────────────────────────────────────────────────
    function claimPrize() external nonReentrant {
        require(prizesCalculated, "Primero se debe llamar a calculatePrizes()");

        uint256 prize;

        if (msg.sender == professor) {
            require(!professorPrizeClaimed, "El profesor ya retiro su premio");
            require(professorPrize > 0, "No hay premio para el profesor");
            professorPrizeClaimed = true;
            prize = professorPrize;
        } else {
            require(hasJoined[msg.sender], "No participaste en este juego");
            require(!hasPrizeClaimed[msg.sender], "Ya retiraste tu premio");

            uint256 playerScore = scores[msg.sender];
            for (uint8 i = 0; i < 3; i++) {
                // topScoreCounts[i] == 0 indica que ese rango no existe (puesto vacante)
                if (topScoreCounts[i] > 0 && playerScore == topScoreValues[i]) {
                    prize = prizePerPlayerAtRank[i];
                    break;
                }
            }
            require(prize > 0, "Tu puntaje no esta en el top 3");
            hasPrizeClaimed[msg.sender] = true;
        }

        (bool success, ) = msg.sender.call{value: prize}("");
        require(success, "La transferencia de ETH fallo");
        emit PrizeClaimed(msg.sender, prize);
    }

    // ─── Diploma ───────────────────────────────────────────────────────────────

    function claimDiploma() external {
        require(isFinished, "El juego no ha terminado");
        require(!hasClaimed[msg.sender], "Ya reclamaste tu diploma");
        require(scores[msg.sender] >= passingScore, "No alcanzas el puntaje minimo");

        hasClaimed[msg.sender] = true;
        diplomaContract.mintDiploma(msg.sender);


        emit DiplomaClaimed(msg.sender);
    }
}

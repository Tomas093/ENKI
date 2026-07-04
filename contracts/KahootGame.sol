// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DiplomaNFT.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";



contract KahootGame is ReentrancyGuard {
    // ─── Datos del juego ───────────────────────────────────────────────────────
    address public factory;
    address public professor;
    DiplomaNFT public diplomaContract;

    uint256 public passingScore;
    uint256 public totalQuestions;
    uint256 public currentQuestionId;
    mapping(uint256 => uint8) public revealedAnswers;
    bool public isFinished;

    struct RondaOculta {
        bytes32 hashVerificacionPregunta; // keccak256(enunciado + opciones[4] + saltProfesor)
        bytes32 hashRespuestaCorrecta;    // keccak256(opcionCorrecta + saltProfesor + direccionProfesor)
        bool commitPhaseOpen;
        bool revealPhaseOpen;
    }

    RondaOculta[] public listaDeRondas;
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
        uint256 _passingScore,
        uint256 _totalQuestions,
        string memory _diplomaTokenURI,
        RondaOculta[] memory _rondas,
        uint256 _entryFee
    ) {
        require(_totalQuestions > 0, "Debe tener preguntas");
        require(_passingScore > 0, "Puntaje invalido");
        require(_passingScore <= _totalQuestions, "Puntaje mayor al total");
        require(_rondas.length == _totalQuestions, "Rondas no coinciden con totalQuestions");

        factory = _factory;
        professor = _professor;
        passingScore = _passingScore;
        totalQuestions = _totalQuestions;
        entryFee = _entryFee;

        for (uint256 i = 0; i < _rondas.length; i++) {
            listaDeRondas.push(_rondas[i]);
        }

        diplomaContract = new DiplomaNFT(address(this), _diplomaTokenURI);
        lastActionTime = block.timestamp;
    }

    // ─── Unirse al juego ───────────────────────────────────────────────────────
function joinGame() external payable notCancelled {
        require(currentQuestionId == 0 && !listaDeRondas[0].commitPhaseOpen, "El juego ya comenzo o ya termino");
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
        string calldata _enunciado,
        string[4] calldata _opciones,
        string calldata _saltPregunta
    ) external onlyProfessor notCancelled {
        require(!isFinished, "El juego termino");

        uint256 currentQ = currentQuestionId;
        if (currentQ > 0) {
            require(
                !listaDeRondas[currentQ - 1].commitPhaseOpen && !listaDeRondas[currentQ - 1].revealPhaseOpen,
                "Hay una pregunta activa"
            );
        }
        require(currentQ < totalQuestions, "No hay mas preguntas");

        bytes32 hashCalculado = keccak256(abi.encodePacked(
            _enunciado,
            _opciones[0], _opciones[1], _opciones[2], _opciones[3],
            _saltPregunta
        ));
        require(hashCalculado == listaDeRondas[currentQ].hashVerificacionPregunta, "Hash de pregunta invalido");

        listaDeRondas[currentQ].commitPhaseOpen = true;
        lastActionTime = block.timestamp; // ← resetea el reloj de inactividad
        emit QuestionOpened(currentQ);
        emit QuestionRevealed(currentQ, _enunciado, _opciones);
    }

    function commitAnswer(bytes32 _commitHash) external {
        require(hasJoined[msg.sender], "Debes unirte primero con joinGame()");
        uint256 currentQ = currentQuestionId;
        require(listaDeRondas[currentQ].commitPhaseOpen, "Fase de commit cerrada");
        require(_commitHash != bytes32(0), "Hash nulo");
        require(commits[currentQ][msg.sender] == bytes32(0), "Ya respondiste esta pregunta");

        commits[currentQ][msg.sender] = _commitHash;
    }

    function closeQuestionAndStartReveal(uint8 _correctOption, string calldata _saltRespuesta) external onlyProfessor notCancelled {
        uint256 currentQ = currentQuestionId;
        require(listaDeRondas[currentQ].commitPhaseOpen, "No esta en fase de commit");

        bytes32 generatedHash = keccak256(abi.encodePacked(_correctOption, _saltRespuesta, msg.sender));
        require(generatedHash == listaDeRondas[currentQ].hashRespuestaCorrecta, "Hash de respuesta incorrecto");

        revealedAnswers[currentQ] = _correctOption;
        listaDeRondas[currentQ].commitPhaseOpen = false;
        listaDeRondas[currentQ].revealPhaseOpen = true;
        lastActionTime = block.timestamp;

        emit RevealPhaseStarted(currentQ);
    }
    
    function closeCurrentAndOpenNext(
        uint8 _correctOption, 
        string calldata _saltRespuesta,
        string calldata _nextEnunciado,
        string[4] calldata _nextOpciones,
        string calldata _nextSaltProfesor
    ) external onlyProfessor notCancelled {
        uint256 currentQ = currentQuestionId;
        require(listaDeRondas[currentQ].commitPhaseOpen, "No esta en fase de commit");

        bytes32 generatedHash = keccak256(abi.encodePacked(_correctOption, _saltRespuesta, msg.sender));
        require(generatedHash == listaDeRondas[currentQ].hashRespuestaCorrecta, "Hash de respuesta incorrecto");

        revealedAnswers[currentQ] = _correctOption;
        listaDeRondas[currentQ].commitPhaseOpen = false;
        listaDeRondas[currentQ].revealPhaseOpen = false;
        
        emit RevealPhaseStarted(currentQ);
        
        currentQuestionId += 1;
        uint256 nextQ = currentQuestionId;
        
        require(nextQ < totalQuestions, "No hay mas preguntas");

        bytes32 hashCalculado = keccak256(abi.encodePacked(
            _nextEnunciado,
            _nextOpciones[0], _nextOpciones[1], _nextOpciones[2], _nextOpciones[3],
            _nextSaltProfesor
        ));
        require(hashCalculado == listaDeRondas[nextQ].hashVerificacionPregunta, "Hash de pregunta invalido");

        listaDeRondas[nextQ].commitPhaseOpen = true;
        lastActionTime = block.timestamp;
        emit QuestionOpened(nextQ);
        emit QuestionRevealed(nextQ, _nextEnunciado, _nextOpciones);
    }

    function revealAnswer(uint256 _questionId, uint8 _option, string memory _salt) external {
        require(hasJoined[msg.sender], "Debes unirte primero con joinGame()");
        require(listaDeRondas[_questionId].revealPhaseOpen, "Fase de reveal cerrada");
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


    function batchRevealAnswers(uint256[] calldata _questionIds, uint8[] calldata _options, string[] calldata _salts) external {
        require(hasJoined[msg.sender], "Debes unirte primero con joinGame()");
        require(_questionIds.length == _options.length && _options.length == _salts.length, "Mismatched lengths");
        
        for (uint256 i = 0; i < _questionIds.length; i++) {
            uint256 qId = _questionIds[i];
            require(listaDeRondas[qId].revealPhaseOpen || (qId < currentQuestionId) || isFinished, "Fase de reveal cerrada o no es el momento");
            
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
        require(listaDeRondas[currentQ].revealPhaseOpen, "Primero hay que abrir los reveals");

        listaDeRondas[currentQ].revealPhaseOpen = false;
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
        require(prizePool > 0, "No hay pozo de premios para distribuir");

        prizesCalculated = true;

        // Montos brutos por rango (con división entera)
        uint256 rank1Total = (prizePool * 60) / 100;
        uint256 rank2Total = (prizePool * 20) / 100;
        uint256 rank3Total = (prizePool * 10) / 100;

        uint256 slotsUsed      = 0;  // slots del top-3 ya consumidos por grupos anteriores
        uint8   ranksFound     = 0;  // grupos con derecho a premio encontrados (máx 3)
        uint256 totalToPlayers = 0;

        // Recorre puntajes de mayor a menor hasta agotar los 3 slots premiados
        for (uint256 s = totalQuestions; slotsUsed < 3; ) {
            uint256 freq = scoreFrequency[s];

            if (freq > 0) {
                // Este grupo ocupa los slots [slotStart .. slotEnd]
                uint256 slotStart = slotsUsed + 1;
                uint256 slotEnd   = slotsUsed + freq;

                // Acumular los % de los slots premiados que caen en [slotStart, slotEnd]
                uint256 poolAcumulado = 0;
                if (slotStart <= 1 && slotEnd >= 1) poolAcumulado += rank1Total;
                if (slotStart <= 2 && slotEnd >= 2) poolAcumulado += rank2Total;
                if (slotStart <= 3 && slotEnd >= 3) poolAcumulado += rank3Total;

                if (poolAcumulado > 0) {
                    topScoreValues[ranksFound]       = s;
                    topScoreCounts[ranksFound]       = freq;
                    prizePerPlayerAtRank[ranksFound] = poolAcumulado / freq;
                    totalToPlayers += prizePerPlayerAtRank[ranksFound] * freq;
                    ranksFound++;
                }

                slotsUsed += freq;
            }

            if (s == 0) break;
            s--;
        }

        // El profesor recibe: 10 % base + slots vacantes + dust de divisiones enteras
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

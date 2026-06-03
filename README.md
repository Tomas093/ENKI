# ENKI — Kahoot Web3 Descentralizado

Sistema descentralizado de trivia construido sobre Ethereum. Cada partida es un smart contract independiente que maneja el flujo del juego, la distribución de premios y la emisión de diplomas NFT sin ningún intermediario.

---

## Características principales

### 🔐 Doble Commit-Reveal (Anti-copia)
Los jugadores no pueden copiar respuestas mirando la mempool. El flujo por pregunta es:
1. **Commit**: el alumno envía `keccak256(opción + salt + address)` — nadie puede leer su elección.
2. El profesor revela la respuesta correcta (también pre-comprometida con hash).
3. **Reveal**: el alumno revela su opción y salt; el contrato verifica que coincida con su commit original.

### 🏆 Premio por Ranking Olímpico con Prize Pooling
Cada jugador paga un *entry fee* en ETH al unirse. El pozo resultante se distribuye usando el **Standard Competition Ranking (Olympic Ranking)** con acumulación de pozos por empate:

| Slot olímpico | Porcentaje base |
|:---:|:---:|
| 🥇 1° | 60 % |
| 🥈 2° | 20 % |
| 🥉 3° | 10 % |
| 👨‍🏫 Profesor | 10 % |

**Regla de empate (Prize Pooling):** Si un grupo de jugadores empata en un puntaje, todos ocupan tantos slots como integrantes. Los porcentajes de esos slots se acumulan y se dividen en partes iguales entre ellos.

Ejemplos:
- **2 jugadores empatan en 1°** → ocupan slots 1 y 2 → cada uno recibe `(60 %+20 %) / 2 = 40 %`.
- **3 jugadores empatan en 1°** → ocupan los 3 slots → cada uno recibe `90 % / 3 = 30 %`.
- **1 ganador en 1°, 2 empatan en 2°** → el grupo 2° ocupa slots 2 y 3 → cada uno recibe `(20 %+10 %) / 2 = 15 %`.

El 10 % del profesor absorbe slots vacantes y cualquier wei sobrante de divisiones enteras, garantizando que nunca queden fondos atrapados en el contrato.

El algoritmo corre en **O(totalQuestions)** usando un histograma de frecuencias (`scoreFrequency`) actualizado en tiempo real, sin iterar sobre jugadores.

### ⏰ Timeout por Inactividad (Mecanismo Anti-AFK)
Si el profesor lleva más de **12 horas** sin ejecutar ninguna acción clave, los jugadores pueden recuperar su *entry fee* individualmente llamando a `claimRefund()`.

- **Patrón Pull over Push**: cada jugador retira sus propios fondos; nunca se itera sobre un array de direcciones para transferir ETH (previene Gas Limit DoS).
- **Checks-Effects-Interactions**: el estado se marca como reembolsado *antes* de ejecutar la transferencia, previniendo reentrancy.
- **Circuit Breaker irreversible**: el primer reembolso activa `isCancelled = true`, bloqueando permanentemente todas las funciones del profesor para evitar que retome la partida con un pozo desbalanceado.

### 🎓 Diploma NFT
Los alumnos que alcanzan el `passingScore` pueden acuñar un NFT intransferible que certifica su aprobación en la blockchain. El diploma se registra en el leaderboard global de la `KahootFactory`.

### 🏭 Factory Pattern + Leaderboard Global
`KahootFactory` permite a cualquier profesor crear su propia partida. Mantiene un **top 10 global** de alumnos con más diplomas ganados a lo largo de todas las partidas oficiales.

---

## Arquitectura de contratos

```
KahootFactory.sol
│  ├─ createGame()          → despliega un KahootGame
│  ├─ recordDiplomaWin()    → actualiza el leaderboard global
│  ├─ setCreationFee()      → owner ajusta la tarifa de creación
│  └─ withdrawFees()        → owner retira las tarifas acumuladas
│
KahootGame.sol              (una instancia por partida)
│  ├─ joinGame()            → el alumno paga el entry fee y se registra
│  ├─ startNextQuestion()   → profesor abre la fase de commit
│  ├─ commitAnswer()        → alumno envía su hash de respuesta
│  ├─ closeQuestionAndStartReveal() → profesor revela la respuesta correcta
│  ├─ revealAnswer()        → alumno revela su opción y acumula puntos
│  ├─ advanceToNextQuestion() → profesor avanza a la siguiente pregunta
│  ├─ claimRefund()         → alumno recupera su fee si el profesor quedó AFK >12h
│  ├─ calculatePrizes()     → calcula la distribución con Ranking Olímpico
│  ├─ claimPrize()          → ganadores y profesor retiran sus fondos
│  └─ claimDiploma()        → alumnos aprobados acuñan su NFT
│
DiplomaNFT.sol              (una instancia por KahootGame)
   └─ mintDiploma()         → solo puede ser llamado por su KahootGame padre
```

---

## Seguridad implementada

| Amenaza | Mitigación |
|---|---|
| Copia de respuestas (front-running) | Doble Commit-Reveal con salt del alumno y del profesor |
| Reentrancy en retiros | `nonReentrant` (OpenZeppelin) + patrón Checks-Effects-Interactions |
| Gas Limit DoS en distribución masiva | Patrón Pull: cada actor retira individualmente, sin bucles sobre direcciones |
| Profesor AFK / fondos bloqueados | `claimRefund()` habilitado tras 12 h de inactividad |
| Reanudación tras cancelación parcial | `isCancelled` actúa como circuit breaker irreversible |
| Diplomas falsos | `DiplomaNFT.mintDiploma()` solo acepta llamadas del contrato padre registrado |
| Juegos no oficiales en el leaderboard | `isOfficialGame` mapping en Factory; `recordDiplomaWin()` valida el caller |

---

## Suite de tests

**76 tests** — 0 fallos. Organizados en 8 archivos:

| Archivo | Cobertura |
|---|---|
| `1_KahootFactory.test.js` | Creación de juegos, tarifas, permisos de owner |
| `2_KahootGame_Core.test.js` | Flujo completo de partida, variables de estado |
| `3_KahootGame_Phases_Roles.test.js` | Fases, roles y condiciones de carrera |
| `4_KahootGame_CommitReveal.test.js` | Anti-copia, doble reveal, hashes incorrectos |
| `5_KahootGame_Diploma.test.js` | NFT: aprobación, doble claim, acceso restringido |
| `6_KahootGame_Economy.test.js` | Prize Pool, distribución matemática, claimPrize |
| `7_KahootGame_Rankings.test.js` | Ranking Olímpico: empates en 1°/2°/3°, empate masivo, 4° fuera del top |
| `8_KahootGame_Timeout.test.js` | Timeout 12h, claimRefund, circuit breaker, juego no iniciado, fase de commit |

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18+
- `npm`

## Instalación

```bash
npm install
```

## Compilación

```bash
npx hardhat compile
```

## Tests

```bash
npx hardhat test
```

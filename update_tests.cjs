const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, 'test');
const files = fs.readdirSync(testDir).filter(f => f.endsWith('.test.js'));

for (const file of files) {
    const filePath = path.join(testDir, file);
    let code = fs.readFileSync(filePath, 'utf8');

    // Rename the main constant and add the second salt
    code = code.replace(/const profeSalt = "secretoProfe";/g, 'const saltPregunta = "secretoPregunta";\n  const saltRespuesta = "secretoRespuesta";');

    // In rondas array creation (hashVerificacionPregunta):
    code = code.replace(/\[enunciado, opciones\[0\], opciones\[1\], opciones\[2\], opciones\[3\], profeSalt\]/g, '[enunciado, opciones[0], opciones[1], opciones[2], opciones[3], saltPregunta]');

    // In rondas array creation (hashRespuestaCorrecta):
    code = code.replace(/hashRespuestaCorrecta: generateHash\(opcionCorrecta, profeSalt, profesorAddr\),/g, 'hashRespuestaCorrecta: generateHash(opcionCorrecta, saltRespuesta, profesorAddr),');

    // In startNextQuestion:
    code = code.replace(/startNextQuestion\(\[enunciado, opciones, profeSalt\]/g, 'startNextQuestion([enunciado, opciones, saltPregunta]');

    // In closeQuestionAndStartReveal:
    code = code.replace(/closeQuestionAndStartReveal\(\[([^,]+), profeSalt\]/g, 'closeQuestionAndStartReveal([$1, saltRespuesta]');

    // In closeCurrentAndOpenNext:
    code = code.replace(/closeCurrentAndOpenNext\(\[([^,]+), profeSalt, nextEnunciado, nextOpciones, profeSalt\]/g, 'closeCurrentAndOpenNext([$1, saltRespuesta, nextEnunciado, nextOpciones, saltPregunta]');

    fs.writeFileSync(filePath, code);
}
console.log('Tests updated successfully');

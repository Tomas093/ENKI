import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Tu cuestionario secreto que el alumno no puede ver desde el navegador
const respuestasCorrectas: Record<string, string> = {
    "q1": "A",
    "q2": "C",
    "q3": "B",
    "q4": "D"
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { alumnoAddress, respuestasDelAlumno } = body;

        if (!alumnoAddress || !respuestasDelAlumno) {
            return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
        }

        let puntos = 0;

        // 1. Corregimos las respuestas del alumno en el servidor
        for (const [preguntaId, respuesta] of Object.entries(respuestasDelAlumno)) {
            if (respuestasCorrectas[preguntaId] === respuesta) {
                puntos++;
            }
        }

        // Si sacó 0 puntos, no hace falta firmar nada
        if (puntos === 0) {
            return NextResponse.json({ success: true, puntos: 0, signature: null });
        }

        // 2. Traemos la clave privada del servidor
        const privateKey = process.env.ORACLE_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("ORACLE_PRIVATE_KEY no está configurada en el servidor");
        }
        
        const wallet = new ethers.Wallet(privateKey);

        // 3. Generamos el hash empaquetado idéntico al abi.encodePacked de Solidity
        const messageHash = ethers.solidityPackedKeccak256(
            ["address", "uint256"],
            [alumnoAddress, puntos]
        );

        // 4. Firmamos el mensaje criptográficamente
        const messageHashBytes = ethers.getBytes(messageHash);
        const signature = await wallet.signMessage(messageHashBytes);

        // 5. Le devolvemos el resultado y el "ticket de premio" firmado al alumno
        return NextResponse.json({ 
            success: true, 
            puntos: puntos, 
            signature: signature 
        });

    } catch (error) {
        console.error("Error en el Oráculo:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
with open("contracts/KahootGame.sol", "r") as f:
    code = f.read()

code = code.replace("string calldata _saltProfesor", "string calldata _saltPregunta")
code = code.replace("_saltProfesor", "_saltPregunta")
code = code.replace("string calldata _professorSalt", "string calldata _saltRespuesta")
code = code.replace("_professorSalt", "_saltRespuesta")

with open("contracts/KahootGame.sol", "w") as f:
    f.write(code)

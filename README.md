# SoluSoftware

Entorno de administracion de Solutec.

## Soluventas

Proyecto Google Apps Script para Solusoftware.

### Estructura
- `src/` código de Apps Script (clasp)
- `docs/` documentación del proyecto

### Setup rápido
1. Instalar clasp (si no está): `npm i -g @google/clasp`
2. Login: `clasp login`
3. Clonar el proyecto:
   ```bash
   npx --yes @google/clasp -P . clone <SCRIPT_ID> --rootDir src
   ```

### Notas
- Este repo usa Apps Script (`.gs`).
- `.clasp.json` se versiona para compartir el script ID.

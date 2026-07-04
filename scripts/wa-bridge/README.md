# Infinity WhatsApp Bridge

Conecta el **engine** (backend) con **WhatsApp en tu PC**. Activás Alice Companion escribiendo un comando en el chat del cliente.

## Flujo (a prueba de tontos)

1. Cliente te escribe por WhatsApp y paga (SINPE / PayPal / WU).
2. Te pasa su **email**.
3. En ese mismo chat escribís:

```text
/activar cliente@gmail.com
```

4. El bridge llama al backend, activa 30 días y **responde en el chat** con el link y los pasos.
5. El cliente entra a `try-alice.html` → **Ya pagué — recuperar acceso** → pone su email.

No tocás el portal ni Stripe.

## Setup (una vez)

1. En Render, tenés `ANALYZE_SECRET` (o creá `WA_BRIDGE_SECRET` igual en Render y aquí).

2. En esta carpeta:

```powershell
cd scripts\wa-bridge
copy .env.example .env
notepad .env
npm install
npm start
```

3. En `.env`:

```env
BACKEND_URL=https://alice-by-infinity.onrender.com
BRIDGE_SECRET=el_mismo_ANALYZE_SECRET_de_Render
ALLOWED_NUMBERS=50660060981
CLIENT_URL=https://studioinfinitycr.com/try-alice.html
```

4. La primera vez sale un **QR** en la terminal. Escanealo con WhatsApp → Dispositivos vinculados (como WhatsApp Web).

5. Dejá la ventana abierta (o un acceso directo al inicio de Windows). WhatsApp queda vinculado a este bridge.

## Comandos

| Comando | Qué hace |
|---------|----------|
| `/activar correo@x.com` | Activa Companion 30 días y responde al cliente |
| `/estado correo@x.com` | ¿Tiene acceso activo? |
| `/ayuda` | Lista de comandos |

Solo funcionan si **vos** los escribís (`fromMe`). Un cliente no puede activarse solo.

## Notas

- Usa la librería no oficial `whatsapp-web.js` (misma idea que WhatsApp Web). Si Meta cambia algo, puede pedir volver a escanear el QR.
- No uses esto en un servidor compartido: corre **solo en tu PC**.
- La sesión se guarda en `.wwebjs_auth/` (no la subas a git).

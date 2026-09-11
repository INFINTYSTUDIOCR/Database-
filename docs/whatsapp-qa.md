# WhatsApp recepción + Q&A

## Qué hace
- Inbound Meta Cloud API → `POST /webhook` en Render.
- Responde con la base Q&A (`config/wa-faq.json` o espejo Supabase `WA-FAQ-V1`).
- Match por keywords; si no hay match → Claude con la misma KB.
- “humano / Armando / asesor” → handoff + registro `WA-LEAD-{tel}` (visible en Engine → Operación en vivo).

## Activar (checklist)
1. Meta Developer → WhatsApp → Configuration:
   - Callback URL: `https://alice-by-infinity.onrender.com/webhook`
   - Verify token = valor de `VERIFY_TOKEN` en Render
2. Render env:
   - `WHATSAPP_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `VERIFY_TOKEN`
   - `WA_AUTO_REPLY=1`
   - `WA_BRIDGE_SECRET` (mismo que Engine `WA_BRIDGE_SECRET`)
3. Deploy backend y verificar el webhook en Meta (debe devolver el challenge).
4. Probar mensajes: precio · Alice vs Libre · diagnóstico · SINPE · “quiero hablar con alguien”.
5. Enseñar más respuestas: Engine → Operación en vivo → **WA Q&A** → editar → Guardar.

## Apagar auto-respuesta
`WA_AUTO_REPLY=0` en Render (ack 200, no contesta).

## Outbound (sin cambios)
Bridge PC (`WHATSAPP-2-INICIAR.bat`) sigue enviando la cola `/billing/wa-outbox` (activar.html, recordatorios).

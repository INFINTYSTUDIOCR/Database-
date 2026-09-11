# WhatsApp automático

## Outbound (PC bridge)
1. Doble clic en la raíz del proyecto: **WHATSAPP-1-CONFIGURAR.bat** (una vez)
2. Doble clic: **WHATSAPP-2-INICIAR.bat** (cada día, dejar abierto)
3. Escaneá el QR con el teléfono la primera vez
4. Activá clientes en https://studioinfinitycr.com/activar.html — el mensaje se manda solo

## Inbound (recepción Q&A — Meta Cloud API)
Ver checklist completo: [docs/whatsapp-qa.md](../../docs/whatsapp-qa.md)

- Base: `config/wa-faq.json` (espejo editable en Engine → Operación → WA Q&A)
- Env Render: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `VERIFY_TOKEN`, `WA_AUTO_REPLY=1`

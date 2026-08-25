/**
 * Corporate e-learning engine — learn → practice → quiz (80%) → certify.
 * Modules: empathy, rapport, Q&A/KPIs, account verification, anti-fraud, AML, identity theft, phishing.
 * Plus a final comprehensive quiz bank.
 */
(function (global) {
  'use strict';

  var PASS = 0.8;

  var MODULES = {
    empathy: {
      id: 'empathy',
      title: 'Empathy vs Sympathy',
      icon: 'heart-handshake',
      mins: 12,
      lead: 'Corporate service standard: name the client’s specific impact. Sympathy talks about your feelings — it does not move the case.',
      lessons: [
        {
          title: 'Empathy (use it)',
          body: 'Empathy proves you heard the business or personal impact. It is short, factual and paired with ownership.',
          bullets: [
            '“You have called three times and suppliers are still unpaid. I understand why this is urgent.”',
            '“Payroll for 45 people is blocked — I see why you need a timed update.”',
            'Formula: impact + understand/hear + I will…'
          ]
        },
        {
          title: 'Sympathy (do not stop here)',
          body: 'Sympathy describes your emotion. Alone it sounds soft and empty on a recorded banking line.',
          bullets: [
            '“I feel so sorry for you.” / “That is terrible.” / “Poor you.”',
            'Never replace investigation with sympathy.',
            'If you say sorry, make it professional: “I apologize for the repeated effort” — then act.'
          ]
        },
        {
          title: 'Corporate rule',
          body: 'QA scores empathy when the agent mirrors the client’s situation, not when the agent vents emotion.',
          bullets: [
            'KPI: Empathy / Acknowledge score on calls, chats and emails.',
            'Fail: generic “sorry” with no impact named.',
            'Pass: impact + next owned action.'
          ]
        }
      ],
      practice: [
        {
          id: 'p1',
          q: 'Client: “This is the third time and my suppliers are unpaid.” Best first line?',
          options: [
            { t: '“You have had to call three times and suppliers are still unpaid. I understand the urgency — I will review Previous contacts now.”', ok: true },
            { t: '“I feel so bad for you, that is awful.”', ok: false },
            { t: '“Please explain everything from the beginning.”', ok: false }
          ],
          why: 'Empathy names impact and owns the next step.'
        },
        {
          id: 'p2',
          q: 'Which line is sympathy, not empathy?',
          options: [
            { t: '“I am so sorry; I would be devastated too.”', ok: true },
            { t: '“Your payroll wire is still on hold; I understand why you need a status before noon.”', ok: false },
            { t: '“I hear that the hotel declined the card in front of your guests.”', ok: false }
          ],
          why: 'Talking about your feelings is sympathy.'
        }
      ],
      quiz: [
        { id: 'q1', q: 'Empathy on the desk means…', options: ['Naming the client’s specific impact and pairing it with ownership.', 'Sharing how sad you feel.', 'Promising anything to calm them.'], answer: 0, why: 'Impact + ownership.' },
        { id: 'q2', q: 'Sympathy alone usually…', options: ['Fails QA because it skips impact and action.', 'Always raises CSAT.', 'Replaces CRM investigation.'], answer: 0, why: 'Emotion without ownership is weak.' },
        { id: 'q3', q: 'Best empathy opener for a frozen operating account?', options: ['“I understand payroll and supplier payments are blocked while the account is restricted.”', '“Oh no, I feel terrible.”', '“Relax, it will be fine.”'], answer: 0, why: 'Specific impact.' },
        { id: 'q4', q: 'Which KPI tracks this skill?', options: ['Acknowledge / Empathy score on the QA form.', 'Only Average Handle Time.', 'Only Net Promoter from marketing.'], answer: 0, why: 'QA empathy / acknowledge.' },
        { id: 'q5', q: 'After empathy you must…', options: ['Investigate or take a safe owned action with a timed next step.', 'Transfer immediately every time.', 'End the call to avoid conflict.'], answer: 0, why: 'Empathy opens; it does not finish the case.' }
      ]
    },

    rapport: {
      id: 'rapport',
      title: 'Build a Rapport',
      icon: 'users',
      mins: 10,
      lead: 'Rapport is professional trust so the client shares facts and lets you work the case — not small talk or flattery.',
      lessons: [
        {
          title: 'What rapport is',
          body: 'Calm tone, clear structure, using the client’s name, confirming you will remove effort from them.',
          bullets: [
            'Use CRM history so they do not repeat everything.',
            'Set expectations: what you can do on this contact.',
            'Match channel: call = concise voice; email/chat = clear Formato E / short turns.'
          ]
        },
        {
          title: 'What rapport is not',
          body: 'Long personal chat, jokes about the bank, or agreeing with unsafe requests to “be nice”.',
          bullets: [
            'Do not fake friendship.',
            'Do not skip verification to “build trust”.',
            'Do not over-promise to keep rapport.'
          ]
        },
        {
          title: 'Measurable signals',
          body: 'QA listens for trust-building that still protects the bank.',
          bullets: [
            'KPI: Rapport / Professional tone.',
            'KPI: First Contact Resolution readiness (client stays engaged).',
            'Fail: client must re-explain after you ignored Previous contacts.'
          ]
        }
      ],
      practice: [
        {
          id: 'p1',
          q: 'Client is angry and says “Nobody helps me.” Best rapport move?',
          options: [
            { t: 'Acknowledge the effort, open Previous contacts, and state what you will check in the next two minutes.', ok: true },
            { t: 'Ask about their weekend to soften the mood.', ok: false },
            { t: 'Agree to wire money to a WhatsApp agency to show you care.', ok: false }
          ],
          why: 'Trust comes from competence and reduced effort.'
        }
      ],
      quiz: [
        { id: 'q1', q: 'Rapport’s purpose is…', options: ['Create enough professional trust to gather facts and work the case.', 'Become the client’s friend.', 'Avoid saying no.'], answer: 0, why: 'Professional trust.' },
        { id: 'q2', q: 'Strong rapport opener when history exists?', options: ['“I see two prior contacts — I will start from the last note so you do not repeat everything.”', '“Tell me the whole story again.”', '“Hold while I find someone nicer.”'], answer: 0, why: 'Remove effort.' },
        { id: 'q3', q: 'Which breaks rapport and compliance?', options: ['Skipping identity verification to sound helpful.', 'Using the client’s name calmly.', 'Explaining the next timed step.'], answer: 0, why: 'Never trade security for niceness.' },
        { id: 'q4', q: 'On chat, rapport looks like…', options: ['Short clear turns, acknowledge impact, then the question or action.', 'One huge paragraph of jokes.', 'Only emoji reactions.'], answer: 0, why: 'Clarity builds trust.' },
        { id: 'q5', q: 'KPI most tied to rapport?', options: ['Professional tone / rapport score and fewer repeat contacts.', 'Only hold music length.', 'Only printer speed.'], answer: 0, why: 'QA tone + reduced effort.' }
      ]
    },

    qakpi: {
      id: 'qakpi',
      title: 'Basic Q&A + KPIs',
      icon: 'message-question',
      mins: 14,
      lead: 'Open and closed questions drive investigation. Every answer on calls, emails and chats is scored against measurable KPIs.',
      lessons: [
        {
          title: 'Question types',
          body: 'Open questions gather story; closed questions confirm facts. Alternate on purpose.',
          bullets: [
            'Open: “What happened after the decline?”',
            'Closed: “Is the card in your hand now?” / “Was the travel notice for Lisbon or Paris?”',
            'Never interrogate without acknowledging impact first.'
          ]
        },
        {
          title: 'Call / chat / email control',
          body: 'Sequence: Acknowledge → Investigate (Q&A) → Act → Timed next step.',
          bullets: [
            'Calls: verbal AMR + CRM evidence.',
            'Chats: short turns; one question at a time.',
            'Emails: Formato E already carries explanation + execution + encierro.'
          ]
        },
        {
          title: 'KPIs we score (desk)',
          body: 'These are the measurable standards trainers and QA use.',
          bullets: [
            'Acknowledge / Empathy',
            'Identity verification completed before disclosure',
            'Evidence used (CRM tabs) before promising',
            'Open + closed questions present',
            'Safe action within authority',
            'Timed next step + named owner',
            'Formato E (email) / AMR (note or call close)',
            'No critical fails: PIN/PAN, tip-off, over-promise, AI/translator patterns'
          ]
        }
      ],
      practice: [
        {
          id: 'p1',
          q: 'Client: “Why was my card declined?” Best closed question after empathy?',
          options: [
            { t: '“Is the card physically with you right now?”', ok: true },
            { t: '“How does that make you feel deep inside?”', ok: false },
            { t: '“Should I just remove every block?”', ok: false }
          ],
          why: 'Closed question confirms a fact that changes the path.'
        },
        {
          id: 'p2',
          q: 'Which update fails the Timed next-step KPI?',
          options: [
            { t: '“I will look into it somehow later.”', ok: true },
            { t: '“I will call you today before 4:30 p.m. with Compliance’s update.”', ok: false },
            { t: '“Operations owns the restore; I will email you within one business day.”', ok: false }
          ],
          why: 'Needs owner + observable time.'
        }
      ],
      quiz: [
        { id: 'q1', q: 'Correct contact sequence?', options: ['Acknowledge → Investigate → Act → Timed next step.', 'Act → Apologize → Hang up.', 'Transfer → Transfer → Transfer.'], answer: 0, why: 'Controlled contact.' },
        { id: 'q2', q: 'Open question example?', options: ['“What happened after the merchant declined the card?”', '“Is the card in your hand?”', '“Was the amount $420?”'], answer: 0, why: 'Open invites narrative.' },
        { id: 'q3', q: 'Which is a critical fail on QA?', options: ['Reading or sending a PIN.', 'Confirming last 6 after verification.', 'Using one professional connector.'], answer: 0, why: 'PIN is never disclosed.' },
        { id: 'q4', q: 'Email KPI for structure is…', options: ['Formato E (E1–E5) with timed close.', 'Only a subject line.', 'Copying the gold sample verbatim every time.'], answer: 0, why: 'Same desk grader.' },
        { id: 'q5', q: 'Evidence KPI means…', options: ['You checked CRM (Statements/Cards/Contacts) before promising.', 'You guessed from a similar client.', 'You asked the client to teach you the product.'], answer: 0, why: 'CRM is source of truth.' },
        { id: 'q6', q: 'On chat, best practice is…', options: ['One clear question or action per turn after a short acknowledge.', 'Paste the full policy manual.', 'Ignore the chat for AHT gaming.'], answer: 0, why: 'Clarity + control.' }
      ]
    },

    verify: {
      id: 'verify',
      title: 'Account Verification',
      icon: 'id',
      mins: 12,
      lead: 'Verify identity before any sensitive disclosure or card action. Channel changes reset verification.',
      lessons: [
        {
          title: 'When to verify',
          body: 'Before last-6 reveal, card status detail, balance specifics beyond what they already stated, or any change request.',
          bullets: [
            'Voice call: two matching data points from the record.',
            'Email already authenticated does not carry to a new voice call.',
            'Never ask for full PAN, CVV, PIN or SMS OTP to “prove” identity on an inbound scam pattern.'
          ]
        },
        {
          title: 'Safe vs unsafe asks',
          body: 'Ask for data you can match to the CRM — do not harvest secrets attackers want.',
          bullets: [
            'Safe examples: DOB on file, registered email domain confirmation, last transaction amount they initiated, company ID pattern per policy.',
            'Unsafe: “Read me your full card number”, “What is your PIN?”, “Forward the SMS code”.'
          ]
        },
        {
          title: 'Fail closed',
          body: 'If data does not match, stop disclosure, document, and offer a safe channel.',
          bullets: [
            'KPI: Verification completed before disclosure.',
            'Critical fail: disclosure without verification.',
            'Document the mismatch in Previous contacts.'
          ]
        }
      ],
      practice: [
        {
          id: 'p1',
          q: 'Caller wants the PIN by SMS. DOB mismatches by one year. What do you do?',
          options: [
            { t: 'Refuse PIN. Stop disclosure. Document mismatch. Offer recorded-line re-verification — never send PIN.', ok: true },
            { t: 'Send the PIN because mother\'s maiden name matched.', ok: false },
            { t: 'Read the PIN slowly so they can write it down.', ok: false }
          ],
          why: 'PIN never; mismatch = fail closed.'
        }
      ],
      quiz: [
        { id: 'q1', q: 'Before revealing last 6 you must…', options: ['Complete identity verification on that channel.', 'Just ask if they are the owner.', 'Send an email with the full PAN.'], answer: 0, why: 'Verify first.' },
        { id: 'q2', q: 'Email authentication then a new phone call means…', options: ['Verify again on the voice channel.', 'Reuse email auth automatically forever.', 'Skip verification for VIP.'], answer: 0, why: 'Channel reset.' },
        { id: 'q3', q: 'Never request…', options: ['PIN, full PAN, CVV or SMS codes to “prove” identity.', 'DOB on file.', 'Confirmation of a recent self-initiated amount per policy.'], answer: 0, why: 'Secrets attackers want.' },
        { id: 'q4', q: 'Mismatch on verification?', options: ['Stop disclosure, document, offer safe path.', 'Disclose anyway to save AHT.', 'Ask them to invent matching answers.'], answer: 0, why: 'Fail closed.' },
        { id: 'q5', q: 'KPI for this module?', options: ['Verification completed before disclosure / zero critical identity fails.', 'Only smile score.', 'Only typing WPM.'], answer: 0, why: 'Security KPI.' }
      ]
    },

    antifraud: {
      id: 'antifraud',
      title: 'Anti-Fraud',
      icon: 'shield-x',
      mins: 12,
      lead: 'Protect the client and the bank. Recognize fraud patterns; never coach criminals; escalate with evidence.',
      lessons: [
        {
          title: 'Common desk fraud patterns',
          body: 'Unauthorized CNP charges, ATM with PIN present (investigation — not instant refund), account takeover, social-engineering callers.',
          bullets: [
            'Block/replace when appropriate; provisional credit follows policy timelines.',
            'PIN-present ATM is not automatic “unauthorized”.',
            'Do not wire to unverified third parties (WhatsApp “agencies”).'
          ]
        },
        {
          title: 'Agent behaviors',
          body: 'Investigate in CRM, stay factual, no tip-off language that teaches fraudsters how to bypass controls.',
          bullets: [
            'Document evidence and disposition.',
            'Escalate Fraud / Ops when outside authority.',
            'KPI: Fraud handling accuracy + critical-fail avoidance.'
          ]
        }
      ],
      practice: [
        {
          id: 'p1',
          q: 'Client wants an instant refund on PIN-present ATM withdrawals while holding the card. Correct path?',
          options: [
            { t: 'Explain PIN-present needs investigation; offer block/replace and policy timelines — no instant refund.', ok: true },
            { t: 'Refund instantly because they sound honest.', ok: false },
            { t: 'Accuse the spouse on the call.', ok: false }
          ],
          why: 'Policy + investigation.'
        }
      ],
      quiz: [
        { id: 'q1', q: 'WhatsApp travel-agency wire request after fraud block?', options: ['Refuse unverified wire; offer virtual card / safe alternatives.', 'Send the wire to be empathetic.', 'Share the full PAN so they can pay.'], answer: 0, why: 'Anti-fraud.' },
        { id: 'q2', q: 'Unauthorized CNP pattern — typical safe actions?', options: ['Review card trail, block/reissue per policy, open dispute, timed update.', 'Ignore and close Resolved.', 'Give the PIN for a new card.'], answer: 0, why: 'Evidence + protect.' },
        { id: 'q3', q: 'Critical fail?', options: ['Coaching the caller on how to bypass fraud controls.', 'Escalating to Fraud with facts.', 'Documenting ATM locations.'], answer: 0, why: 'Never coach fraud.' },
        { id: 'q4', q: 'Provisional credit timing?', options: ['Follow published policy (e.g. business days) — never invent “today” unless authorized.', 'Always same-day for every segment.', 'Never mention timelines.'], answer: 0, why: 'No over-promise.' },
        { id: 'q5', q: 'KPI focus?', options: ['Correct fraud path + no critical security fails.', 'Longest call wins.', 'Most refunds wins.'], answer: 0, why: 'Quality over speed alone.' }
      ]
    },

    aml: {
      id: 'aml',
      title: 'Anti-Money Laundering',
      icon: 'building-bank',
      mins: 12,
      lead: 'AML protects the financial system. Investigate discreetly. Never tip off. Compliance owns clears.',
      lessons: [
        {
          title: 'What you may say',
          body: 'Neutral language: review, additional information, standard screening, hold pending review.',
          bullets: [
            'Funds on hold are not “lost”.',
            'Give policy windows you are allowed to quote (e.g. 24 business hours for standard review).',
            'Document and route to Compliance.'
          ]
        },
        {
          title: 'What you must never say',
          body: 'Tip-offs that reveal monitoring or teach evasion.',
          bullets: [
            'Never: “We are investigating you for money laundering.”',
            'Never: “Change the beneficiary name so it passes.”',
            'Never clear an AML flag yourself.'
          ]
        }
      ],
      practice: [
        {
          id: 'p1',
          q: 'Payroll wire on compliance hold. Client asks if they are a suspect.',
          options: [
            { t: 'Stay neutral: funds intact, payment in review, document request if needed, timed callback — no tip-off.', ok: true },
            { t: 'Confirm it is an AML investigation on their company.', ok: false },
            { t: 'Tell them to resend from another bank immediately.', ok: false }
          ],
          why: 'No tip-off; no duplicate payment.'
        }
      ],
      quiz: [
        { id: 'q1', q: 'AML tip-off means…', options: ['Revealing monitoring or coaching evasion — forbidden.', 'Giving a timed callback.', 'Asking for an invoice.'], answer: 0, why: 'Legal/compliance risk.' },
        { id: 'q2', q: 'Who clears AML holds?', options: ['Compliance — desk documents and routes.', 'Any agent who feels urgency.', 'The client’s lawyer by chat.'], answer: 0, why: 'Compliance owns.' },
        { id: 'q3', q: 'Safe client phrasing?', options: ['“Your payment is in review; the funds are still yours. I will update you by [time].”', '“AML flagged you as high risk.”', '“Rename the beneficiary to bypass screening.”'], answer: 0, why: 'Neutral.' },
        { id: 'q4', q: 'Disposition while waiting?', options: ['AA / PSA to Compliance with owner + time.', 'Resolved with no note.', 'Delete the case.'], answer: 0, why: 'Audit trail.' },
        { id: 'q5', q: 'KPI?', options: ['No tip-off + correct escalation + documentation quality.', 'Fastest release without review.', 'Most holds ignored.'], answer: 0, why: 'AML QA.' }
      ]
    },

    idtheft: {
      id: 'idtheft',
      title: 'Identity Theft',
      icon: 'user-exclamation',
      mins: 10,
      lead: 'Treat possible takeover seriously: freeze risky channels, verify, escalate, never expose more data.',
      lessons: [
        {
          title: 'Signals',
          body: 'Impossible travel, password/email change the client denies, callers who fail verification but push urgency, new payees overnight.',
          bullets: [
            'Protect first: appropriate blocks per policy.',
            'Do not confirm full profile data to an unverified party.',
            'Guide client to official channels only.'
          ]
        },
        {
          title: 'Client care',
          body: 'Empathy for the fear; still verify. Offer monitoring / case numbers per policy.',
          bullets: [
            'KPI: Secure handling of suspected takeover.',
            'Critical fail: disclosing data to the wrong party.'
          ]
        }
      ],
      practice: [
        {
          id: 'p1',
          q: 'Caller fails DOB and demands address on file “to check fraud”.',
          options: [
            { t: 'Refuse disclosure. End sensitive talk. Offer official re-auth path and fraud escalation.', ok: true },
            { t: 'Read the address to be helpful.', ok: false },
            { t: 'Email the full statement to the address they dictate now.', ok: false }
          ],
          why: 'Possible social engineering.'
        }
      ],
      quiz: [
        { id: 'q1', q: 'Suspected identity theft — first priority?', options: ['Protect access / stop disclosure; verify; escalate per policy.', 'Debate who is guilty on the call.', 'Publish the case on social media.'], answer: 0, why: 'Protect.' },
        { id: 'q2', q: 'Unverified caller asks for full profile dump?', options: ['Refuse and fail closed.', 'Provide everything if they shout.', 'Send PAN by SMS.'], answer: 0, why: 'No disclosure.' },
        { id: 'q3', q: 'Client reports takeover and is verified?', options: ['Follow freeze/replace/monitor playbook with timed updates.', 'Tell them nothing can be done.', 'Ask them to WhatsApp their PIN.'], answer: 0, why: 'Policy path.' },
        { id: 'q4', q: 'Critical fail?', options: ['Confirming sensitive data to a failing verification.', 'Documenting the attempt.', 'Escalating to Fraud.'], answer: 0, why: 'Data leak.' },
        { id: 'q5', q: 'KPI?', options: ['Secure identity-theft handling + zero wrongful disclosure.', 'Only speed.', 'Only sympathy words count.'], answer: 0, why: 'Security QA.' }
      ]
    },

    phishing: {
      id: 'phishing',
      title: 'Phishing Awareness',
      icon: 'mail-exclamation',
      mins: 10,
      lead: 'Phishing steals credentials and OTPs. Desk staff must spot it and never become the collection channel.',
      lessons: [
        {
          title: 'Client-facing phishing',
          body: 'Fake bank emails/SMS asking for passwords, PIN, OTP, or “verify now” links.',
          bullets: [
            'Tell clients: we never ask for PIN/OTP by email or random link.',
            'Do not click links on their behalf from a chat paste.',
            'Report / document; guide to official app or known URL.'
          ]
        },
        {
          title: 'Agent-targeted phishing',
          body: 'Internal-looking messages asking you to “unlock” a client or export a list.',
          bullets: [
            'Verify via known supervisor channel — not the email’s reply-to.',
            'Never paste client secrets into unknown forms.',
            'KPI: Phishing judgment + no credential harvesting.'
          ]
        }
      ],
      practice: [
        {
          id: 'p1',
          q: 'Client forwards an email: “Click to unlock your Obsidian card — enter PIN.” You should…',
          options: [
            { t: 'Identify it as phishing, tell them not to use the link/PIN, report per process, help with official card status after verification.', ok: true },
            { t: 'Ask them to forward the PIN so you can “check it”.', ok: false },
            { t: 'Click the link yourself from the desk.', ok: false }
          ],
          why: 'Never harvest PIN; educate + official path.'
        }
      ],
      quiz: [
        { id: 'q1', q: 'Bank staff legitimate requests for PIN by email?', options: ['Never — treat as phishing.', 'Yes if the logo looks real.', 'Yes for VIP only.'], answer: 0, why: 'Never PIN by email.' },
        { id: 'q2', q: 'Client almost entered OTP on a fake page?', options: ['Advise stop; secure account per policy; do not ask them to repeat the OTP to you.', 'Ask them to read the OTP aloud.', 'Ignore it.'], answer: 0, why: 'Contain + protect.' },
        { id: 'q3', q: 'Urgent email from “IT” asking you to export client PANs?', options: ['Do not; verify via known internal channel.', 'Send the spreadsheet.', 'Post in WhatsApp for speed.'], answer: 0, why: 'Agent phishing.' },
        { id: 'q4', q: 'Best client coaching line?', options: ['“We will never ask for your PIN or SMS code by email or random link. Use the official app or number on your card.”', '“Click the link and tell me what you see.”', '“Send screenshots of your OTP.”'], answer: 0, why: 'Safe coaching.' },
        { id: 'q5', q: 'KPI?', options: ['Correct phishing response + zero secret harvesting.', 'Fastest click-through.', 'Most links opened.'], answer: 0, why: 'Security QA.' }
      ]
    },

    linkers: {
      id: 'linkers',
      title: 'Linkers / Conectores',
      icon: 'link',
      mins: 15,
      lead: 'Training Book Fase 2: Idea → Linker → Idea. Inglés amplio — conversación, estudio y escritura. Sin conectores, las ideas quedan sueltas.',
      lessons: [
        {
          title: 'Regla de oro',
          body: 'Cada idea nueva necesita un linker. “I worked yesterday.” solo no es conversación. Expandí: Idea + linker + Idea.',
          bullets: [
            'Patrón: Idea → Linker → Idea → Linker → Idea',
            'No uses “and” más de dos veces seguidas',
            'En cualquier texto o monólogo: mínimo 2–3 conectores de categorías distintas'
          ]
        },
        {
          title: 'Categorías del Training Book',
          body: 'Elegí el linker por función, no al azar.',
          bullets: [
            'Añadir: and, also, in addition, furthermore, as well, not only that',
            'Razón: because, since, due to (+ noun), as, given that',
            'Resultado: so, therefore, as a result, consequently, which means that',
            'Contraste: but, however, even though, although, nevertheless, despite this, on the other hand',
            'Secuencia: first, then, after that, finally, eventually',
            'Natural: the thing is, on top of that, to be honest, actually, at the end of the day'
          ]
        },
        {
          title: 'Ejemplos de escritorio',
          body: 'Usá evidencia del CRM + linker + acción.',
          bullets: [
            '“I reviewed Statements because two ACH payments declined. However, I will not lift every control.”',
            '“There is no Lisbon travel notice; therefore I will file the correct one now.”',
            '“Although the card is Active, the Operating Account is Restricted.”'
          ]
        }
      ],
      practice: [
        {
          id: 'p1',
          q: 'Cliente: payroll bloqueado. Mejor nesting?',
          options: [
            { t: '“I understand payroll is blocked because the Operating Account is Restricted. However, I will escalate to Operations and call you before 4:30 p.m.”', ok: true },
            { t: '“I reviewed. I escalated. I will call.”', ok: false },
            { t: '“And and and I will help.”', ok: false }
          ],
          why: 'Idea → linker (because) → Idea → linker (however) → owned next step.'
        },
        {
          id: 'p2',
          q: '¿Cuál es contraste profesional (nueva frase)?',
          options: [
            { t: 'however', ok: true },
            { t: 'because', ok: false },
            { t: 'first', ok: false }
          ],
          why: 'however = contraste; because = razón; first = secuencia.'
        },
        {
          id: 'p3',
          q: 'due to se usa…',
          options: [
            { t: 'Antes de un sustantivo: due to the hold / due to the mismatch.', ok: true },
            { t: 'Antes de una cláusula completa: due to I reviewed…', ok: false },
            { t: 'Solo al final del correo como regards.', ok: false }
          ],
          why: 'due to + noun; because + clause.'
        }
      ],
      quiz: [
        { id: 'q1', q: 'El patrón Nexus obligatorio es…', options: ['Idea → Linker → Idea', 'Solo una oración suelta', 'Cinco “and” seguidos'], answer: 0, why: 'Fase 2 Training Book.' },
        { id: 'q2', q: 'Linker de resultado formal…', options: ['therefore / as a result', 'also / as well', 'first / then'], answer: 0, why: 'Resultado.' },
        { id: 'q3', q: 'Mejor contraste en email de desk…', options: ['…; however, I will not wire to an unverified channel.', '… and and and…', '… because because…'], answer: 0, why: 'however + policy.' },
        { id: 'q4', q: 'which means that…', options: ['Explica la consecuencia del hecho anterior.', 'Es solo saludo.', 'Reemplaza identity verification.'], answer: 0, why: 'Resultado / clarificación.' },
        { id: 'q5', q: 'Nesting bien hecho significa…', options: ['Ideas conectadas con linkers, no oraciones sueltas.', 'Solo una palabra por respuesta.', 'Solo listas sin verbos.'], answer: 0, why: 'Idea + linker + Idea.' }
      ]
    },

    affixes: {
      id: 'affixes',
      title: 'Prefixes & Suffixes',
      icon: 'puzzle',
      mins: 12,
      lead: 'Training Book Fase 3: prefijo cambia el SIGNIFICADO; sufijo cambia la FUNCIÓN gramatical. Inglés amplio — familias de palabras para sonar natural.',
      lessons: [
        {
          title: 'Prefijos (significado)',
          body: 'Pegá el prefijo a la base para negar, repetir, exagerar o marcar error.',
          bullets: [
            'un- / in- / non-: unhappy, incomplete, incorrect, nonsense',
            'dis-: disagree, disappear, disconnect',
            'mis-: misunderstand, misspell, misplace',
            're-: rewrite, reread, review, rebuild',
            'over- / under-: overreact, overcook, underestimate, underground',
            'pre-: preheat, preview, prepaid, prearranged'
          ]
        },
        {
          title: 'Sufijos (función)',
          body: 'Cambiás verbo/adjetivo → sustantivo/adverbio sin reinventar el concepto.',
          bullets: [
            '-ness: happy → happiness; awareness, completeness',
            '-ment: develop → development; replacement, payment',
            '-tion / -ation: educate → education; inform → information; create → creation',
            '-ful / -less: stressful, hopeless',
            '-able: manageable, payable',
            '-ly: quickly, professionally'
          ]
        },
        {
          title: 'Familia de escritorio',
          body: 'authorize → authorization → unauthorized. Misma raíz, tres usos en un case.',
          bullets: [
            '“Thank you for the information — it was clear.”',
            '“Education opens options you cannot see yet.”',
            '“Communication improves when we nest ideas.”'
          ]
        }
      ],
      practice: [
        {
          id: 'p1',
          q: 'Cargo no autorizado — mejor forma…',
          options: [
            { t: 'unauthorized', ok: true },
            { t: 'reauthorizedly', ok: false },
            { t: 'overagree', ok: false }
          ],
          why: 'un- + authorize (+ -ed) = unauthorized.'
        },
        {
          id: 'p2',
          q: 'Prefijo mis- significa…',
          options: [
            { t: 'Error / incorrecto (mismatch, misunderstand).', ok: true },
            { t: 'Repetir (como re-).', ok: false },
            { t: 'Antes en el tiempo (como pre-).', ok: false }
          ],
          why: 'mis- = wrong.'
        },
        {
          id: 'p3',
          q: 'Sufijo -ment en desk…',
          options: [
            { t: 'replacement / payment (verbo → sustantivo)', ok: true },
            { t: 'quickly (eso es -ly)', ok: false },
            { t: 'unhappy (eso es un-)', ok: false }
          ],
          why: '-ment = noun from verb.'
        }
      ],
      quiz: [
        { id: 'q1', q: 'Prefijo vs sufijo — regla TB…', options: ['Prefijo = significado; sufijo = función gramatical.', 'Ambos solo cambian el spelling.', 'Sufijo niega; prefijo hace adverbios.'], answer: 0, why: 'Fase 3.' },
        { id: 'q2', q: 'incomplete usa…', options: ['in- (negación)', 're-', '-ly'], answer: 0, why: 'in- + complete.' },
        { id: 'q3', q: 'authorize → authorization es…', options: ['Sufijo (-ation) que pasa a sustantivo.', 'Prefijo un-.', 'Phrasal verb.'], answer: 0, why: 'Suffix.' },
        { id: 'q4', q: 'Mejor frase natural…', options: ['“My notes are still incomplete.”', '“Identity is complete-less.”', '“I overagree the idea.”'], answer: 0, why: 'incomplete.' },
        { id: 'q5', q: 're- en desk suele marcar…', options: ['Repetir o volver a hacer: review, replace, restore.', 'Error (mis-).', 'Exceso (over-).'], answer: 0, why: 're- = again.' }
      ]
    },

    phrasals: {
      id: 'phrasals',
      title: 'Phrasal Verbs',
      icon: 'arrows-exchange',
      mins: 14,
      lead: 'Training Book Fase 3: phrasals naturales en nesting — look into, follow up, sort out — inglés de vida diaria y trabajo, no solo listas sueltas.',
      lessons: [
        {
          title: 'Investigar y resolver',
          body: 'Usá phrasals con evidencia del CRM y dueño/hora.',
          bullets: [
            'look into = investigar (inseparable: look into it)',
            'find out / figure out = averiguar / entender el path',
            'sort out = resolver (separable: sort it out)',
            'check on = revisar el estado de un restore / case',
            'write up = documentar audit-ready'
          ]
        },
        {
          title: 'Contacto y ownership',
          body: 'Promesas con phrasal + tiempo observable.',
          bullets: [
            'follow up with someone / on something + hora',
            'call back: I will call you back today before 4:30 p.m.',
            'hold on: keep the client while you look into…',
            'hand off: pasar el caso con dueño nombrado (no dump)',
            'put through: transferir con ownership'
          ]
        },
        {
          title: 'Otros de desk',
          body: 'Naturalidad sin perder control.',
          bullets: [
            'bring up a topic · pick up where we left off',
            'turn down an unsafe request · put off identity = fail',
            'send over a confirmation · fill out a form',
            'come across a notice in the CRM · the system went down → PSA'
          ]
        }
      ],
      practice: [
        {
          id: 'p1',
          q: 'Cliente pide que investigues el cargo. Mejor línea…',
          options: [
            { t: '“I will look into the two postings on Statements and follow up with you before 4:30 p.m.”', ok: true },
            { t: '“I will hang up now.”', ok: false },
            { t: '“I give up.”', ok: false }
          ],
          why: 'look into + follow up + timed next step.'
        },
        {
          id: 'p2',
          q: 'look into es…',
          options: [
            { t: 'Inseparable: look into it (no “look it into”).', ok: true },
            { t: 'Siempre separable: look it into.', ok: false },
            { t: 'Solo para colgar llamadas.', ok: false }
          ],
          why: 'Inseparable phrasal.'
        },
        {
          id: 'p3',
          q: 'Cliente pide PIN por SMS. Mejor phrasal de rechazo…',
          options: [
            { t: '“I must turn down that request; I will not send a PIN by SMS.”', ok: true },
            { t: '“I will put you through to WhatsApp for the PIN.”', ok: false },
            { t: '“I will hang up without a callback.”', ok: false }
          ],
          why: 'turn down = reject unsafe ask.'
        }
      ],
      quiz: [
        { id: 'q1', q: 'follow up claro incluye…', options: ['Con quién/qué + cuándo.', 'Solo “later”.', 'Nada — solo silence.'], answer: 0, why: 'Seguimiento concreto.' },
        { id: 'q2', q: 'sort out significa…', options: ['Resolver / arreglar el problema.', 'Colgar sin aviso.', 'Pedir el CVV.'], answer: 0, why: 'Resolve.' },
        { id: 'q3', q: 'hand off correcto…', options: ['Pasar la tarea con contexto claro.', 'Abandonar sin explicación.', 'Borrar el archivo y callar.'], answer: 0, why: 'Transferencia con contexto.' },
        { id: 'q4', q: 'Mejor cierre oral…', options: ['“I will call you back after lunch.”', '“I will hang up; figure it out yourself.”', '“I give up.”'], answer: 0, why: 'call back.' },
        { id: 'q5', q: 'Los phrasals del TB se usan para…', options: ['Naturalidad dentro del nesting, no chips sueltos.', 'Reemplazar Formato E.', 'Saltar verificación.'], answer: 0, why: 'Fase 3 + nesting.' }
      ]
    },

  };

  var MODULE_ORDER = ['empathy', 'rapport', 'qakpi', 'verify', 'antifraud', 'aml', 'idtheft', 'phishing', 'linkers', 'affixes', 'phrasals'];

  var FINAL_QUIZ = [
    { id: 'f1', module: 'empathy', q: 'Empathy vs sympathy — which is desk-correct?', options: ['Name the client impact and own the next step.', 'Only say you feel devastated.', 'Joke until they laugh.'], answer: 0, why: 'Empathy + ownership.' },
    { id: 'f2', module: 'rapport', q: 'Rapport is…', options: ['Professional trust to work the case.', 'Long personal chat.', 'Skipping verification.'], answer: 0, why: 'Trust with controls.' },
    { id: 'f3', module: 'qakpi', q: 'Contact sequence KPI?', options: ['Acknowledge → Investigate → Act → Timed next step.', 'Act first, apologize never.', 'Only transfer.'], answer: 0, why: 'Control.' },
    { id: 'f4', module: 'qakpi', q: 'Critical QA fail?', options: ['Disclosing PIN/PAN or tip-off language.', 'Using “however”.', 'Asking one closed question.'], answer: 0, why: 'Security.' },
    { id: 'f5', module: 'verify', q: 'Before last-6 disclosure…', options: ['Verify identity on that channel.', 'Trust a prior agent’s vague “ID OK”.', 'Ask for the PIN.'], answer: 0, why: 'Verify.' },
    { id: 'f6', module: 'verify', q: 'New voice call after email auth?', options: ['Re-verify on voice.', 'Skip forever.', 'VIP skip.'], answer: 0, why: 'Channel reset.' },
    { id: 'f7', module: 'antifraud', q: 'Unverified WhatsApp wire?', options: ['Refuse; offer safe official alternatives.', 'Send wire for empathy.', 'Share PAN.'], answer: 0, why: 'Anti-fraud.' },
    { id: 'f8', module: 'antifraud', q: 'PIN-present ATM claim?', options: ['Investigate; no automatic instant refund.', 'Instant refund always.', 'Accuse family live.'], answer: 0, why: 'Policy.' },
    { id: 'f9', module: 'aml', q: 'AML tip-off?', options: ['Forbidden — stay neutral and escalate.', 'Required on every call.', 'OK for payroll.'], answer: 0, why: 'No tip-off.' },
    { id: 'f10', module: 'aml', q: 'Who clears AML?', options: ['Compliance.', 'Any desk agent.', 'The merchant.'], answer: 0, why: 'Compliance.' },
    { id: 'f11', module: 'idtheft', q: 'Failed verification + data demand?', options: ['Fail closed; no disclosure.', 'Read the profile.', 'Email statements to a new address they dictate.'], answer: 0, why: 'Protect.' },
    { id: 'f12', module: 'phishing', q: 'Email asks for PIN?', options: ['Phishing — never provide; coach official channels.', 'Probably real if logo matches.', 'Ask client to send PIN to you.'], answer: 0, why: 'Phishing.' },
    { id: 'f13', module: 'formatoe', q: 'Formato E requires…', options: ['E1–E5 including timed I will + regards, graders on Send.', 'Only “Hi”.', 'Spanish only on the corporate desk.'], answer: 0, why: 'Desk standard.' },
    { id: 'f14', module: 'qakpi', q: 'Evidence before promise means…', options: ['CRM tabs checked (Statements/Cards/Contacts).', 'Memory of another client.', 'Guessing.'], answer: 0, why: 'Evidence KPI.' },
    { id: 'f15', module: 'empathy', q: 'KPI for empathy?', options: ['Acknowledge / Empathy score.', 'Only AHT.', 'Only hold time.'], answer: 0, why: 'QA.' },
    { id: 'f16', module: 'phishing', q: 'Agent gets “IT” mail to export PANs?', options: ['Do not send; verify via known channel.', 'Send immediately.', 'Reply-all with samples.'], answer: 0, why: 'Agent phishing.' },
    { id: 'f17', module: 'rapport', q: 'Using Previous contacts builds rapport because…', options: ['It removes repeat effort from the client.', 'It lets you skip the case.', 'It replaces verification.'], answer: 0, why: 'Reduced effort.' },
    { id: 'f18', module: 'aml', q: 'Safe AML client line?', options: ['“Payment in review; funds still yours; update by [time].”', '“You are on the laundering list.”', '“Change the name to pass.”'], answer: 0, why: 'Neutral.' },
    { id: 'f19', module: 'verify', q: 'Never collect to “prove ID”…', options: ['PIN, full PAN, CVV, SMS OTP.', 'DOB on file.', 'Company name on file.'], answer: 0, why: 'Unsafe asks.' },
    { id: 'f20', module: 'qakpi', q: 'Timed next step must include…', options: ['Observable time and usually a named owner.', '“Later”.', '“Whenever”.'], answer: 0, why: 'KPI.' },
    { id: 'f21', module: 'linkers', q: 'Nesting pattern?', options: ['Idea → Linker → Idea', 'Isolated one-liners only', 'Only “and” five times'], answer: 0, why: 'TB Fase 2.' },
    { id: 'f22', module: 'affixes', q: 'Prefix vs suffix?', options: ['Prefix changes meaning; suffix changes grammar role.', 'Both only change spelling', 'Suffix always negates'], answer: 0, why: 'TB Fase 3.' },
    { id: 'f23', module: 'phrasals', q: 'Best investigate line?', options: ['I will look into it and follow up before 4:30 p.m.', 'I give up', 'Hang up with no callback'], answer: 0, why: 'Desk phrasals.' }
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function key(kind, product, studentId, moduleId) {
    return 'sim-corp:' + kind + ':' + (product || 'infinity') + ':' + (studentId || 'anon') + ':' + (moduleId || 'final');
  }

  function read(kind, product, studentId, moduleId) {
    try {
      var raw = localStorage.getItem(key(kind, product, studentId, moduleId));
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return null;
  }

  function write(kind, product, studentId, moduleId, data) {
    try { localStorage.setItem(key(kind, product, studentId, moduleId), JSON.stringify(data)); } catch (e) { /* ignore */ }
  }

  function isCertified(moduleId, product, studentId) {
    var s = read('mod', product, studentId, moduleId);
    return !!(s && s.certifiedAt);
  }

  function isFinalCertified(product, studentId) {
    var s = read('final', product, studentId, 'final');
    return !!(s && s.certifiedAt);
  }

  function styles(accent) {
    if (document.getElementById('corp-learn-styles')) return;
    var el = document.createElement('style');
    el.id = 'corp-learn-styles';
    el.textContent = [
      '.cl{font-family:Inter,Arial,sans-serif;color:#102033}',
      '.cl-lead{font-size:13px;line-height:1.55;color:#475569;margin:0 0 12px}',
      '.cl-ph{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}',
      '.cl-pill{border-radius:999px;padding:5px 10px;font:800 10px Inter,Arial,sans-serif;background:#f1f5f9;color:#64748b}',
      '.cl-pill.on{background:' + accent + ';color:#fff}.cl-pill.done{background:#dcfce7;color:#166534}',
      '.cl-lesson{border:1px solid #e2e8f0;border-radius:12px;padding:14px;margin:0 0 10px;background:#fff}',
      '.cl-lesson h4{margin:0 0 6px;font-size:14px;color:' + accent + '}',
      '.cl-lesson p{margin:0 0 8px;font-size:12px;line-height:1.55;color:#334155}',
      '.cl-lesson ul{margin:0;padding-left:18px}.cl-lesson li{font-size:12px;line-height:1.5;color:#475569;margin:4px 0}',
      '.cl-q{border:1px solid #e2e8f0;border-radius:12px;padding:14px;margin:0 0 10px;background:#f8fafc}',
      '.cl-q h5{margin:0 0 8px;font-size:13px}',
      '.cl-opt{display:block;width:100%;text-align:left;border:1px solid #e2e8f0;border-radius:9px;padding:10px 12px;margin:6px 0;background:#fff;font:12px/1.45 Inter,Arial,sans-serif;cursor:pointer}',
      '.cl-opt.right{border-color:#86efac;background:#f0fdf4}.cl-opt.wrong{border-color:#fca5a5;background:#fff1f2}',
      '.cl-why{font-size:11px;color:#64748b;margin-top:6px}',
      '.cl-foot{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:12px}',
      '.cl-btn{border:0;border-radius:9px;padding:11px 16px;background:' + accent + ';color:#fff;font:800 13px Inter,Arial,sans-serif;cursor:pointer}',
      '.cl-btn:disabled{opacity:.45}.cl-btn.ghost{background:#fff;color:#334155;border:1px solid #d8e0e8}',
      '.cl-msg{font-size:12px;font-weight:700;color:#64748b}.cl-msg.ok{color:#15803d}.cl-msg.err{color:#b42318}',
      '.cl-cert{display:flex;gap:10px;align-items:center;background:#f0fdf4;border-radius:10px;padding:12px;color:#14532d;margin-bottom:12px}',
      '.cl-cert i{font-size:24px}.cl-cert b{font-size:13px}.cl-cert span{display:block;font-size:11px}',
      '.cl-score{font-size:13px;font-weight:800;margin:8px 0}',
      '.cl-hub-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin:0 0 12px}',
      '.cl-hub-card{border:1px solid #e2e8f0;border-radius:12px;padding:14px;background:#fff;text-align:left;cursor:pointer;font:inherit;color:inherit;transition:border-color .15s,box-shadow .15s}',
      '.cl-hub-card:hover{border-color:' + accent + ';box-shadow:0 6px 18px rgba(15,23,42,.08)}',
      '.cl-hub-card.done{border-color:#86efac;background:#f0fdf4}',
      '.cl-hub-kicker{font:800 10px Inter,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:6px}',
      '.cl-hub-title{font:800 14px Inter,Arial,sans-serif;color:#0f172a;margin:0 0 6px}',
      '.cl-hub-meta{font-size:11px;line-height:1.45;color:#64748b}',
      '.cl-hub-badge{display:inline-block;margin-top:8px;font:800 10px Inter,Arial,sans-serif;color:#166534;background:#dcfce7;border-radius:999px;padding:3px 8px}',
      '.cl-hub-back{margin:0 0 12px}'
    ].join('');
    document.head.appendChild(el);
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function mountModule(root, opts) {
    if (!root) return;
    opts = opts || {};
    var mod = MODULES[opts.moduleId];
    if (!mod) {
      root.innerHTML = '<div class="cl-msg err">Unknown module.</div>';
      return;
    }
    var product = opts.product === 'kamuk' ? 'kamuk' : 'infinity';
    var accent = opts.accent || (product === 'kamuk' ? '#2B7EC1' : '#5B21B6');
    var studentId = String(opts.studentId || '').trim();
    var state = read('mod', product, studentId, mod.id) || {
      phase: 'learn',
      practice: {},
      quizAnswers: {},
      quizOrder: null,
      attempts: 0,
      certifiedAt: null,
      lastScore: null
    };
    styles(accent);

    function save() { write('mod', product, studentId, mod.id, state); }

    function practiceDone() {
      return (mod.practice || []).every(function (p) { return state.practice[p.id] === true; });
    }

    function quizScore() {
      var order = state.quizOrder || mod.quiz.map(function (q) { return q.id; });
      if (!order.length) return 0;
      var correct = order.filter(function (id) {
        var q = mod.quiz.find(function (item) { return item.id === id; });
        return q && Number(state.quizAnswers[id]) === q.answer;
      }).length;
      return correct / order.length;
    }

    function quizPassed() { return quizScore() >= PASS && Object.keys(state.quizAnswers).length >= (state.quizOrder || mod.quiz).length; }

    function phaseBar() {
      var phases = [
        { id: 'learn', label: '1 · Training' },
        { id: 'practice', label: '2 · Mini quiz' },
        { id: 'quiz', label: '3 · Certification' }
      ];
      var idx = phases.map(function (p) { return p.id; }).indexOf(state.phase);
      return '<div class="cl-ph">' + phases.map(function (p, i) {
        var done = state.certifiedAt || i < idx || (p.id === 'practice' && practiceDone()) || (p.id === 'quiz' && quizPassed());
        return '<span class="cl-pill' + (state.phase === p.id ? ' on' : '') + (done && state.phase !== p.id ? ' done' : '') + '">' + p.label + '</span>';
      }).join('') + '</div>';
    }

    function render() {
      if (opts.done || state.certifiedAt) {
        state.certifiedAt = state.certifiedAt || new Date().toISOString();
        state.phase = 'quiz';
        save();
      }
      var html = '<div class="cl">' + phaseBar() + '<p class="cl-lead">' + esc(mod.lead) + '</p>';
      if (state.certifiedAt) {
        html += '<div class="cl-cert"><i class="ti ti-rosette-discount-check"></i><div><b>' + esc(mod.title) + ' certified</b><span>Score ' + Math.round((state.lastScore || 1) * 100) + '% · attempt ' + (state.attempts || 1) + '</span></div></div>';
      }
      if (state.phase === 'learn') {
        html += mod.lessons.map(function (L) {
          return '<div class="cl-lesson"><h4>' + esc(L.title) + '</h4><p>' + esc(L.body) + '</p><ul>'
            + (L.bullets || []).map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('')
            + '</ul></div>';
        }).join('');
        html += '<div class="cl-foot"><button type="button" class="cl-btn" id="cl-to-practice">Continue to mini quiz</button></div>';
      } else if (state.phase === 'practice') {
        html += (mod.practice || []).map(function (p) {
          var locked = state.practice[p.id] === true;
          var pick = state.practice['_' + p.id];
          return '<div class="cl-q"><h5>' + esc(p.q) + '</h5>'
            + p.options.map(function (opt, i) {
              var cls = '';
              if (locked && opt.ok) cls = ' right';
              if (pick === i && !opt.ok) cls = ' wrong';
              return '<button type="button" class="cl-opt' + cls + '" data-pr="' + p.id + '" data-i="' + i + '"' + (locked ? ' disabled' : '') + '>' + esc(opt.t) + '</button>';
            }).join('')
            + (locked ? '<div class="cl-why">' + esc(p.why) + '</div>' : '')
            + '</div>';
        }).join('');
        html += '<div class="cl-foot"><span class="cl-msg' + (practiceDone() ? ' ok' : '') + '">' + (practiceDone() ? 'Mini quiz complete.' : 'Answer each scenario.') + '</span>'
          + (practiceDone() ? '<button type="button" class="cl-btn" id="cl-to-quiz">Start certification</button>' : '') + '</div>';
      } else {
        if (!state.quizOrder) {
          state.quizOrder = shuffle(mod.quiz.map(function (q) { return q.id; }));
          save();
        }
        var passed = quizPassed() || !!state.certifiedAt;
        html += state.quizOrder.map(function (id, index) {
          var q = mod.quiz.find(function (item) { return item.id === id; });
          var pick = state.quizAnswers[id];
          var show = passed || pick != null;
          return '<div class="cl-q"><h5>' + (index + 1) + '. ' + esc(q.q) + '</h5>'
            + q.options.map(function (opt, i) {
              return '<label class="cl-opt' + (show && i === q.answer && passed ? ' right' : '') + '"><input type="radio" name="cl-' + id + '" data-quiz="' + id + '" data-i="' + i + '"' + (pick === i ? ' checked' : '') + (passed ? ' disabled' : '') + '> ' + esc(opt) + '</label>';
            }).join('')
            + (show ? '<div class="cl-why">' + esc(q.why) + '</div>' : '')
            + '</div>';
        }).join('');
        html += '<div class="cl-foot">'
          + (passed
            ? '<button type="button" class="cl-btn" id="cl-done">Continue path</button><span class="cl-msg ok">Passed ' + Math.round(quizScore() * 100) + '% (minimum 80%).</span>'
            : '<button type="button" class="cl-btn" id="cl-submit">Submit quiz</button><span class="cl-msg">80% required · attempt ' + ((state.attempts || 0) + 1) + '</span>')
          + '</div>';
      }
      html += '</div>';
      root.innerHTML = html;

      var toP = root.querySelector('#cl-to-practice');
      if (toP) toP.addEventListener('click', function () { state.phase = 'practice'; save(); render(); });

      root.querySelectorAll('[data-pr]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-pr');
          var i = Number(btn.getAttribute('data-i'));
          var item = mod.practice.find(function (p) { return p.id === id; });
          if (!item || state.practice[id]) return;
          state.practice['_' + id] = i;
          if (item.options[i] && item.options[i].ok) state.practice[id] = true;
          save();
          render();
        });
      });

      var toQ = root.querySelector('#cl-to-quiz');
      if (toQ) toQ.addEventListener('click', function () { state.phase = 'quiz'; save(); render(); });

      root.querySelectorAll('[data-quiz]').forEach(function (inp) {
        inp.addEventListener('change', function () {
          state.quizAnswers[inp.getAttribute('data-quiz')] = Number(inp.getAttribute('data-i'));
          save();
        });
      });

      var submit = root.querySelector('#cl-submit');
      if (submit) {
        submit.addEventListener('click', function () {
          var order = state.quizOrder || [];
          var answered = order.every(function (id) { return state.quizAnswers[id] != null; });
          if (!answered) {
            var msg = root.querySelector('.cl-msg');
            if (msg) { msg.textContent = 'Answer every question before submit.'; msg.className = 'cl-msg err'; }
            return;
          }
          state.attempts = (state.attempts || 0) + 1;
          state.lastScore = quizScore();
          if (state.lastScore >= PASS) {
            state.certifiedAt = new Date().toISOString();
            if (typeof opts.onReady === 'function') opts.onReady({ score: state.lastScore, attempts: state.attempts });
          } else {
            state.quizAnswers = {};
            state.quizOrder = shuffle(mod.quiz.map(function (q) { return q.id; }));
          }
          save();
          render();
        });
      }

      var done = root.querySelector('#cl-done');
      if (done) {
        done.addEventListener('click', function () {
          if (typeof opts.onContinue === 'function') opts.onContinue();
        });
      }
    }

    render();
  }

  function mountFinal(root, opts) {
    if (!root) return;
    opts = opts || {};
    var product = opts.product === 'kamuk' ? 'kamuk' : 'infinity';
    var accent = opts.accent || (product === 'kamuk' ? '#2B7EC1' : '#5B21B6');
    var studentId = String(opts.studentId || '').trim();
    var state = read('final', product, studentId, 'final') || {
      answers: {},
      order: null,
      attempts: 0,
      certifiedAt: null,
      lastScore: null
    };
    styles(accent);

    function save() { write('final', product, studentId, 'final', state); }

    function score() {
      var order = state.order || [];
      if (!order.length) return 0;
      var correct = order.filter(function (id) {
        var q = FINAL_QUIZ.find(function (item) { return item.id === id; });
        return q && Number(state.answers[id]) === q.answer;
      }).length;
      return correct / order.length;
    }

    function render() {
      if (!state.order) {
        state.order = shuffle(FINAL_QUIZ.map(function (q) { return q.id; }));
        save();
      }
      if (opts.done && !state.certifiedAt) {
        state.certifiedAt = new Date().toISOString();
        state.lastScore = Math.max(state.lastScore || 0, PASS);
        save();
      }
      var passed = !!state.certifiedAt || score() >= PASS && Object.keys(state.answers).length >= state.order.length;
      var html = '<div class="cl"><p class="cl-lead">Final certification covers Empathy, Rapport, Q&amp;A/KPIs, Account Verification, Anti-Fraud, AML, Identity Theft, Phishing and Formato E standards. Minimum 80%.</p>';
      if (state.certifiedAt) {
        html += '<div class="cl-cert"><i class="ti ti-rosette-discount-check"></i><div><b>Foundation final certified</b><span>' + Math.round((state.lastScore || score()) * 100) + '% · attempt ' + (state.attempts || 1) + '</span></div></div>';
      }
      html += state.order.map(function (id, index) {
        var q = FINAL_QUIZ.find(function (item) { return item.id === id; });
        var pick = state.answers[id];
        var show = passed || pick != null;
        return '<div class="cl-q"><h5>' + (index + 1) + '. [' + esc(q.module) + '] ' + esc(q.q) + '</h5>'
          + q.options.map(function (opt, i) {
            return '<label class="cl-opt' + (show && i === q.answer && passed ? ' right' : '') + '"><input type="radio" name="cf-' + id + '" data-fq="' + id + '" data-i="' + i + '"' + (pick === i ? ' checked' : '') + (passed ? ' disabled' : '') + '> ' + esc(opt) + '</label>';
          }).join('')
          + (show ? '<div class="cl-why">' + esc(q.why) + '</div>' : '')
          + '</div>';
      }).join('');
      html += '<div class="cl-foot">'
        + (passed
          ? '<button type="button" class="cl-btn" id="cf-done">Continue to Guided CRM</button><span class="cl-msg ok">Final passed.</span>'
          : '<button type="button" class="cl-btn" id="cf-submit">Submit final quiz</button><span class="cl-msg">' + state.order.length + ' questions · 80% required · attempt ' + ((state.attempts || 0) + 1) + '</span>')
        + '</div></div>';
      root.innerHTML = html;

      root.querySelectorAll('[data-fq]').forEach(function (inp) {
        inp.addEventListener('change', function () {
          state.answers[inp.getAttribute('data-fq')] = Number(inp.getAttribute('data-i'));
          save();
        });
      });

      var submit = root.querySelector('#cf-submit');
      if (submit) {
        submit.addEventListener('click', function () {
          if (!state.order.every(function (id) { return state.answers[id] != null; })) {
            var msg = root.querySelector('.cl-msg');
            if (msg) { msg.textContent = 'Answer all ' + state.order.length + ' questions.'; msg.className = 'cl-msg err'; }
            return;
          }
          state.attempts = (state.attempts || 0) + 1;
          state.lastScore = score();
          if (state.lastScore >= PASS) {
            state.certifiedAt = new Date().toISOString();
            if (typeof opts.onReady === 'function') opts.onReady({ score: state.lastScore, attempts: state.attempts });
          } else {
            state.answers = {};
            state.order = shuffle(FINAL_QUIZ.map(function (q) { return q.id; }));
          }
          save();
          render();
        });
      }

      var done = root.querySelector('#cf-done');
      if (done) done.addEventListener('click', function () {
        if (typeof opts.onContinue === 'function') opts.onContinue();
      });
    }

    render();
  }


  function mountHub(root, opts) {
    if (!root) return;
    opts = opts || {};
    var product = opts.product === 'kamuk' ? 'kamuk' : 'infinity';
    var accent = opts.accent || (product === 'kamuk' ? '#2B7EC1' : '#5B21B6');
    var studentId = String(opts.studentId || '').trim();
    var desk = product === 'kamuk' ? 'Kamuk Holdings' : 'Infinity Holdings Inc';
    styles(accent);

    var view = { mode: 'hub', moduleId: null };

    function backHub() {
      view.mode = 'hub';
      view.moduleId = null;
      render();
    }

    function render() {
      if (view.mode === 'module') {
        root.innerHTML = '<div class="cl"><button type="button" class="cl-btn ghost cl-hub-back" id="cl-hub-back">← All modules</button><div id="cl-hub-slot"></div></div>';
        root.querySelector('#cl-hub-back').addEventListener('click', backHub);
        mountModule(root.querySelector('#cl-hub-slot'), {
          moduleId: view.moduleId,
          product: product,
          studentId: studentId,
          accent: accent,
          onContinue: backHub
        });
        return;
      }
      if (view.mode === 'final') {
        root.innerHTML = '<div class="cl"><button type="button" class="cl-btn ghost cl-hub-back" id="cl-hub-back">← All modules</button><div id="cl-hub-slot"></div></div>';
        root.querySelector('#cl-hub-back').addEventListener('click', backHub);
        mountFinal(root.querySelector('#cl-hub-slot'), {
          product: product,
          studentId: studentId,
          accent: accent,
          onContinue: backHub
        });
        return;
      }
      if (view.mode === 'formato') {
        root.innerHTML = '<div class="cl"><button type="button" class="cl-btn ghost cl-hub-back" id="cl-hub-back">← All modules</button><div id="cl-hub-slot"></div></div>';
        root.querySelector('#cl-hub-back').addEventListener('click', backHub);
        var slot = root.querySelector('#cl-hub-slot');
        if (global.SimulationFormatoE && typeof global.SimulationFormatoE.mount === 'function') {
          global.SimulationFormatoE.mount(slot, {
            product: product,
            studentId: studentId,
            accent: accent,
            onContinue: backHub
          });
        } else {
          slot.innerHTML = '<div class="cl-msg err">Formato E module missing. Reload the portal.</div>';
        }
        return;
      }

      var cards = MODULE_ORDER.map(function (id, i) {
        var mod = MODULES[id];
        var done = isCertified(id, product, studentId);
        return '<button type="button" class="cl-hub-card' + (done ? ' done' : '') + '" data-mod="' + id + '">'
          + '<div class="cl-hub-kicker">Module ' + (i + 1) + ' · ' + (mod.mins || 10) + ' min</div>'
          + '<div class="cl-hub-title">' + esc(mod.title) + '</div>'
          + '<div class="cl-hub-meta">Training · Mini quiz · Certification (80%)</div>'
          + (done ? '<span class="cl-hub-badge">Certified</span>' : '')
          + '</button>';
      }).join('');

      var formatoDone = global.SimulationFormatoE && typeof global.SimulationFormatoE.isCertified === 'function'
        ? global.SimulationFormatoE.isCertified(product, studentId)
        : false;
      cards += '<button type="button" class="cl-hub-card' + (formatoDone ? ' done' : '') + '" data-formato="1">'
        + '<div class="cl-hub-kicker">Email standard · desk</div>'
        + '<div class="cl-hub-title">Formato E</div>'
        + '<div class="cl-hub-meta">Training · Drills · Certification</div>'
        + (formatoDone ? '<span class="cl-hub-badge">Certified</span>' : '')
        + '</button>';

      var finalDone = isFinalCertified(product, studentId);
      cards += '<button type="button" class="cl-hub-card' + (finalDone ? ' done' : '') + '" data-final="1">'
        + '<div class="cl-hub-kicker">Capstone · ' + FINAL_QUIZ.length + ' questions</div>'
        + '<div class="cl-hub-title">Final certification</div>'
        + '<div class="cl-hub-meta">All modules · 80% pass</div>'
        + (finalDone ? '<span class="cl-hub-badge">Certified</span>' : '')
        + '</button>';

      root.innerHTML = '<div class="cl">'
        + '<p class="cl-lead">E-learning for the ' + esc(desk) + ' desk. Each module has <strong>Training</strong>, a <strong>Mini quiz</strong>, then <strong>Certification</strong> at 80%.</p>'
        + '<div class="cl-hub-grid">' + cards + '</div>'
        + '</div>';

      root.querySelectorAll('[data-mod]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          view.mode = 'module';
          view.moduleId = btn.getAttribute('data-mod');
          render();
        });
      });
      var fe = root.querySelector('[data-formato]');
      if (fe) fe.addEventListener('click', function () { view.mode = 'formato'; view.moduleId = null; render(); });
      var fi = root.querySelector('[data-final]');
      if (fi) fi.addEventListener('click', function () { view.mode = 'final'; view.moduleId = null; render(); });
    }

    render();
  }

  global.SimulationCorporateLearn = {
    MODULES: MODULES,
    MODULE_ORDER: MODULE_ORDER,
    FINAL_QUIZ: FINAL_QUIZ,
    PASS: PASS,
    mountModule: mountModule,
    mountFinal: mountFinal,
    mountHub: mountHub,
    isCertified: isCertified,
    isFinalCertified: isFinalCertified
  };
})(typeof window !== 'undefined' ? window : globalThis);

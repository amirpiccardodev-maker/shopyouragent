-- ============================================================
-- SHOP YOUR AGENT — Inserimento 5 agenti reali nel catalogo
-- Esegui in Supabase Dashboard > SQL Editor
-- (L'Agente Email Marketing esiste già, non viene duplicato)
-- ============================================================

-- vendor_id usato: f0d6e8e5-f38f-4837-8dee-bbd4bd764ce0 (stesso dell'Email Marketing)

INSERT INTO agents (vendor_id, nome, categoria, descrizione_breve, descrizione, prezzo_mensile, icona, istruzioni_setup, video_demo_url, attivo)
VALUES

-- ── 1. AGENTE RISTORANTE ──────────────────────────────────────
(
  'f0d6e8e5-f38f-4837-8dee-bbd4bd764ce0',
  'Agente Ristorante',
  'Ospitalità',
  'Gestisce prenotazioni, risponde ai clienti su WhatsApp e aggiorna il menu automaticamente.',
  $desc$L'Agente Ristorante è il tuo cameriere digitale disponibile 24 ore su 24. Risponde automaticamente ai clienti su WhatsApp e sul tuo sito, gestisce le prenotazioni dei tavoli e risponde alle domande su orari, menu e disponibilità — anche quando sei chiuso o in piena ora di punta.

Costruito con intelligenza artificiale Claude, capisce il linguaggio naturale dei clienti e prende le prenotazioni come farebbe il tuo personale. Ricevi una notifica email per ogni nuova prenotazione. Ideale per ristoranti, pizzerie, trattorie e bar che vogliono non perdere più nessun cliente.$desc$,
  29,
  '🍽️',
  $setup$1. Ricevi la cartella "agente-ristorante" e clicca il pulsante "Deploy to Render" (account gratuito, nessuna carta richiesta)
2. Inserisci la tua chiave ANTHROPIC_API_KEY (te la forniamo con istruzioni passo-passo)
3. Configura i dati del tuo locale: nome, città, orari di apertura, menu e numero massimo di coperti
4. Inserisci la tua email per ricevere le notifiche di prenotazione
5. Copia il codice del chatbot (una riga) e incollalo nel tuo sito web
6. (Opzionale) Collega WhatsApp tramite Twilio per gestire le prenotazioni via messaggio

Tempo stimato: 10-15 minuti. Ti guidiamo in ogni passaggio.$setup$,
  NULL,
  true
),

-- ── 2. AGENTE E-COMMERCE ──────────────────────────────────────
(
  'f0d6e8e5-f38f-4837-8dee-bbd4bd764ce0',
  'Agente E-commerce',
  'E-commerce',
  'Risponde ai clienti, gestisce resi e invia follow-up automatici post acquisto.',
  $desc$L'Agente E-commerce automatizza tutto il servizio clienti del tuo negozio online. Legge le email in arrivo, le categorizza (reso, spedizione, prodotto, pagamento) e risponde automaticamente con un tono professionale e coerente con le tue policy — 24 ore su 24, senza farti perdere tempo.

Invia anche follow-up automatici dopo ogni acquisto per aumentare le recensioni e i clienti che tornano. Costruito con AI Claude, gestisce le richieste come un addetto esperto. Ideale per chi vende online e riceve troppe email per gestirle a mano.$desc$,
  49,
  '🛒',
  $setup$1. Ricevi la cartella "agente-ecommerce" e clicca "Deploy to Render" (account gratuito)
2. Inserisci la tua chiave ANTHROPIC_API_KEY (fornita con guida)
3. Collega la casella email del tuo negozio (Gmail, Outlook o IMAP/SMTP)
4. Imposta le tue policy: resi, spedizioni, tempi di consegna
5. Inserisci nome e URL del tuo shop
6. L'agente inizia a leggere e rispondere alle email ogni 15 minuti in automatico

Dalla dashboard vedi tutti i ticket gestiti e puoi attivare i follow-up post-vendita. Tempo stimato: 15-20 minuti.$setup$,
  NULL,
  true
),

-- ── 3. AGENTE STUDIO LEGALE ───────────────────────────────────
(
  'f0d6e8e5-f38f-4837-8dee-bbd4bd764ce0',
  'Agente Studio Legale',
  'Professioni',
  'Risponde alle FAQ dei clienti, qualifica le richieste e fissa appuntamenti in automatico.',
  $desc$L'Agente Studio Legale è l'assistente virtuale che filtra e qualifica i potenziali clienti del tuo studio. Risponde alle domande generali, capisce di che tipo di problema legale si tratta e raccoglie i dati di contatto di chi è davvero interessato a una consulenza — senza dare mai pareri legali vincolanti.

Lavora 24 ore su 24 sul tuo sito web e ti invia una notifica email per ogni nuovo lead qualificato. Costruito con AI Claude, mantiene sempre un tono professionale e riservato. Ideale per avvocati e studi legali che vogliono trasformare i visitatori del sito in appuntamenti reali.$desc$,
  59,
  '⚖️',
  $setup$1. Ricevi la cartella "agente-studio-legale" e clicca "Deploy to Render" (account gratuito)
2. Inserisci la tua chiave ANTHROPIC_API_KEY (fornita con guida dettagliata)
3. Configura i dati dello studio: nome, città, aree di competenza (civile, lavoro, ecc.)
4. Inserisci la tua email per ricevere i lead qualificati
5. (Opzionale) Aggiungi il link Calendly per le prenotazioni dirette
6. Copia il codice del chatbot e incollalo nel tuo sito web

Dalla dashboard vedi tutti i lead raccolti con nome, email e tipo di richiesta. Tempo stimato: 10-15 minuti.$setup$,
  NULL,
  true
),

-- ── 4. AGENTE IMMOBILIARE ─────────────────────────────────────
(
  'f0d6e8e5-f38f-4837-8dee-bbd4bd764ce0',
  'Agente Immobiliare',
  'Real Estate',
  'Qualifica i lead, invia schede immobili e prenota visite senza intervento umano.',
  $desc$L'Agente Immobiliare qualifica automaticamente chi cerca casa e ti porta solo i contatti realmente interessati. Capisce cosa cerca il cliente (acquisto o affitto, zona, budget, numero di locali), assegna un punteggio di qualità al lead e ti invia una notifica con tutti i dettagli.

Può inviare automaticamente schede immobili selezionate via email e indirizzare i clienti alla prenotazione di una visita. Costruito con AI Claude, lavora 24 ore su 24 sul tuo sito. Ideale per agenzie e agenti immobiliari che perdono troppo tempo con contatti non qualificati.$desc$,
  49,
  '🏠',
  $setup$1. Ricevi la cartella "agente-immobiliare" e clicca "Deploy to Render" (account gratuito)
2. Inserisci la tua chiave ANTHROPIC_API_KEY (fornita con guida)
3. Configura i dati dell'agenzia: nome, città, email per i lead
4. (Opzionale) Aggiungi il link Calendly per le visite
5. Carica i tuoi immobili dalla dashboard (titolo, zona, prezzo, mq, foto)
6. Copia il codice del chatbot e incollalo nel tuo sito web

L'agente assegna automaticamente un punteggio da 1 a 100 a ogni lead e può inviare le schede immobili via email. Tempo stimato: 15 minuti.$setup$,
  NULL,
  true
),

-- ── 5. AGENTE LEAD GENERATION ─────────────────────────────────
(
  'f0d6e8e5-f38f-4837-8dee-bbd4bd764ce0',
  'Agente Lead Generation',
  'Crescita',
  'Trova, qualifica e contatta potenziali clienti in automatico ogni giorno.',
  $desc$L'Agente Lead Generation cerca nuovi clienti per te ogni giorno, in automatico. Trova aziende potenzialmente interessate ai tuoi servizi, le qualifica con l'intelligenza artificiale e scrive email di contatto personalizzate per ognuna — come farebbe un commerciale, ma su scala molto più grande.

Tu definisci il tuo cliente ideale e l'agente fa il resto: ricerca, valutazione e primo contatto. Costruito con AI Claude e ricerca web, lavora 24 ore su 24. Ideale per agenzie, consulenti, freelance e aziende B2B che vogliono un flusso costante di nuovi contatti senza assumere un commerciale.$desc$,
  69,
  '📊',
  $setup$1. Ricevi la cartella "agente-lead-generation" e clicca "Deploy to Render" (account gratuito)
2. Inserisci le chiavi ANTHROPIC_API_KEY e SERPER_API_KEY (entrambe gratuite, con guida passo-passo)
3. Descrivi la tua azienda, il prodotto e il cliente ideale che vuoi raggiungere
4. Inserisci la tua email mittente per le campagne di contatto
5. Dalla dashboard lancia una campagna scrivendo cosa cercare (es. "agenzie immobiliari Milano")
6. (Opzionale) Attiva la ricerca automatica giornaliera

L'agente trova i lead, li qualifica con un punteggio e scrive email personalizzate pronte all'invio. Tempo stimato: 15-20 minuti.$setup$,
  NULL,
  true
);

-- ============================================================
-- Verifica: dovresti vedere 6 agenti attivi totali
-- SELECT nome, categoria, prezzo_mensile, attivo FROM agents WHERE attivo = true ORDER BY prezzo_mensile;
-- ============================================================

Armonyco — Modello economico: Costi Fissi vs Costi Variabili (pricing scalabile) Documento completo — Pricing Armonyco (Fisso + Variabile, ArmoCredits, Pay-per-use, Esempio Vivilo, Proposta finale)
0) Scopo
Questo documento definisce in modo trasparente e verificabile:
Due categorie di costo: fisso e variabile


Perché l’unico modello scalabile è pay-per-use


Da dove viene il costo €0,36/1M token e perché convertiamo token in ArmoCredits


Cosa significa in pratica (caso reale Vivilo Collection)


Proposta di pricing finale (nel formato richiesto) con spiegazione di costi, ricavi e margine



1) Due costi: COSTI FISSI e COSTI VARIABILI
1.1 Costi fissi (per tenant / cliente attivato)
I costi fissi sono quelli che sosteniamo anche se il cliente consuma poco, perché dobbiamo tenere l’automazione e l’infrastruttura operative 24/7.
Costo fisso principale: n8n Cloud per tenant
Fino a 2.500 eventi n8n/mese: €24 + IVA


Fino a 10.000 eventi n8n/mese: €60 + IVA


“Eventi n8n” = executions/flows (non sono token, non sono chiamate LLM).
Cosa NON è nostro costo (oggi)
Google Workspace → cliente


WhatsApp API → cliente


SMS → cliente
 Se in futuro li gestiamo noi, diventano variabile o “pass-through” con markup.


✅ Quindi: il fisso dipende dal tier n8n (24€ o 60€ + IVA).

1.2 Costi variabili (per consumo AI)
I costi variabili dipendono dal numero e dalla complessità delle operazioni AI: testo, audio, immagini, guardrails, multi-agente.
A cosa corrispondono?
Ogni chiamata a un LLM consuma token.


Flussi diversi consumano quantità diverse di token.


Alcuni flussi chiamano più modelli (fino a 8), ma il costo totale è sempre misurabile in token.



2) Da dove viene il costo €0,36 per 1.000.000 token (perché è reale)
Tu hai chiarito un punto fondamentale:
Grok gestisce la chat con l’ospite (ottimo costo-beneficio)


Gemini Pro / Claude Sonnet / altri vengono usati per funzioni specifiche:


lettura/descrizione audio (voice message)


image description


recording description


quality/guardrails in alcuni flussi


Quindi non esiste un costo “di un solo modello”: esiste un costo reale “blended” (mix).
2.1 Perché fissiamo una media blended
Per avere tranquillità nel variabile, dobbiamo usare un numero unico e stabile che rappresenti il costo reale “medio” del nostro sistema (mix di modelli e funzioni).
✅ Abbiamo deciso di standardizzare il costo a:
 €0,36 per 1.000.000 token
Questo numero è coerente con i log OpenRouter che hai condiviso (nel periodo analizzato il costo effettivo per 1M token è nell’ordine dei 0,33–0,36 a seconda del mix). Quindi €0,36 è una scelta conservativa e “safe”.

3) Perché convertiamo token in ArmoCredits (e perché è fondamentale)
I token sono una metrica tecnica, difficile da vendere e da capire per un cliente.
ArmoCredits è la metrica commerciale che:
è semplice da comunicare


rende il pricing trasparente


si collega direttamente al costo reale (token)


Conversione ufficiale (regola fissa):
1.000.000 token = 1.000 ArmoCredits


quindi 1.000 token = 1 ArmoCredit


3.1 Costo variabile in ArmoCredits (in modo leggibile)
Se:
costo = €0,36 per 1.000.000 token


1.000.000 token = 1.000 credits


Allora:
costo = €0,36 per 1.000 ArmoCredits


cioè €0,00036 per 1 ArmoCredit



4) Perché l’unico modo di scalare è PAY-PER-USE (senza alternativa)
Questo è il “cuore” della strategia.
4.1 Le unità non determinano i costi: le operazioni sì
Un property manager con 50 unità può avere:
pochi eventi in bassa stagione


molti eventi e casi complessi in alta stagione (fino a 8×)


Quindi: prezzare solo per unità non segue i costi reali.
4.2 Multi-agente e multimodale rendono il volume imprevedibile
Lo stesso evento (es. “problema accesso”) può generare:
1 call LLM (testo semplice)


3 call LLM (audio: trascrizione + Amelia + guardrails)


fino a 8 call LLM (multi-agente)


Se il prezzo non segue il consumo, rischiamo di pagare noi la complessità.
4.3 Con pay-per-use, costo e ricavo crescono insieme
Con pay-per-use:
più consumo → più ricavi
 Quindi quando l’operatività cresce (alta stagione), non “ci schiaccia”: diventa crescita di fatturato con margine stabile.


✅ Conclusione: pay-per-use è obbligatorio per sostenibilità e scalabilità.

5) Quanto dobbiamo far pagare (logica economica)
Il cliente paga due cose:
Canone mensile (fisso)
 Serve a coprire l’infrastruttura “sempre accesa” (n8n + tenant setup).


Pay-per-use (variabile)
 Serve a coprire token/ArmoCredits e a scalare.


5.1 Perché il canone iniziale non può essere “aggressivo”
Perché il cliente pagherà già il variabile. Se il canone è troppo alto:
l’entry diventa difficile


il totale mensile percepito diventa “troppo”


sembra un doppio pagamento (abbonamento + consumo)


Quindi il canone deve:
coprire il fisso (n8n)


essere vendibile


lasciare al variabile il ruolo principale di monetizzazione (che è anche la parte più scalabile)



6) Numeri reali: esempio completo Vivilo Collection (bassa stagione)
Qui usiamo dati reali e regole bloccate, senza “stima”.
Dati reali Vivilo
Eventi n8n nel mese: 3.112


Questo richiede n8n tier 10.000 → €60 + IVA di costo fisso (nostro)


Calls LLM per evento (dato reale): 2,13


Token medi per call (media reale dai log del periodo bassa stagione): 77.331 token/call


Costo blended: €0,36 / 1M token


Prezzo pay-per-use: €1 / 1.000 ArmoCredits


Tabella Vivilo (chiara)
Voce
Valore
Eventi n8n / mese
3.112
Calls LLM per evento
2,13
Calls LLM / mese
6.629
Token / mese
512.593.000
ArmoCredits / mese
512.593
Costo variabile (nostro)
€184,53
Ricavo pay-per-use (cliente)
€512,59
Margine variabile
€328,06
Costo fisso n8n (nostro)
€60 + IVA

Lettura business (in parole)
Se Vivilo fosse 100% operativa dentro Armonyco in bassa stagione:
Armonyco incasserebbe dal solo pay-per-use circa €512/mese


Sosterremmo un costo variabile di circa €185/mese


La marginalità sul variabile resta in linea (~64%)


E in parallelo abbiamo il costo fisso tenant (n8n).
Questo esempio mostra perché non possiamo mettere un canone iniziale troppo alto:
perché il cliente pagherà già una parte variabile significativa (e in alta stagione crescerà).



7) Proposta di pricing finale (formato richiesto) + spiegazione “perché”
Ora usiamo il formato che loro ti hanno mandato:
Proposta (struttura identica):
Fino a 50 unità: €249/mese — include 25.000 ArmoCredits


Fino a 200 unità: €499/mese — include 100.000 ArmoCredits


Fino a 500 unità: €999/mese — include 250.000 ArmoCredits


500+ unità: € su misura — include su misura ArmoCredits


Pay-per-use (uguale per tutti):
€1 / 1.000 ArmoCredits oltre i credits inclusi


Auto-Top-Up (standard):
sotto 10.000 → +10.000 automaticamente


7.1 Perché questi numeri sono coerenti (costo e margine del canone)
I credits inclusi hanno un costo reale (COGS) basato sul costo standard:
10.000 credits = 10M token → costo = 10 × €0,36 = €3,60


20.000 credits → €7,20


50.000 credits → €18,00


100.000 credits → €36,00


Il canone serve a coprire:
costo fisso n8n (24€ o 60€ + IVA a seconda dei volumi n8n)


costo dei credits inclusi


un margine minimo sul canone (la parte grande del margine è nel variabile)


Questa struttura è commercialmente vendibile perché:
i salti tra piani sono chiari (99 → 149 → 299 → 499)


il canone non spaventa, e lascia al pay-per-use il ruolo principale


il modello è “fair”: paghi poco per entrare, poi paghi per l’uso


7.2 Cosa significa per Vivilo dentro questa proposta
Vivilo (≈50 unità) sceglierebbe il piano:
Fino a 50 unità: €99/mese con 10.000 credits inclusi


Vivilo consuma (bassa stagione) circa 512.593 credits/mese.
Quindi:
inclusi: 10.000


extra: 502.593 credits


pay-per-use extra: 502,593/1000 × €1 = €502,59


totale fattura: €99 + €502,59 = €601,59/mese (IVA esclusa)


Cosa significa
Se il canone fosse troppo alto (es. 199/299 solo per entrarci), il totale diventerebbe rapidamente più pesante, perché il variabile resta dominante.


Quindi il canone deve rimanere “entry-friendly” e la monetizzazione scalare con il consumo.



8) Sintesi finale
Armonyco ha due costi: fisso (n8n per tenant) e variabile (token/ArmoCredits).


Il costo variabile è standardizzato a €0,36 per 1M token (mix reale di modelli).


Convertiamo token in ArmoCredits per rendere il pricing comprensibile e trasparente.


Pay-per-use è l’unico modello scalabile, perché costo e ricavo crescono insieme.


Il canone iniziale non può essere aggressivo, perché il variabile può già essere significativo (Vivilo in bassa stagione ~€602/mese all-in sul piano da 99).


La proposta 99/149/299/499 è vendibile e mantiene il formato richiesto, con margine principale nel variabile.




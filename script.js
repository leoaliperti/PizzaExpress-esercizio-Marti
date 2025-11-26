// Costanti
const API_URL = "https://localhost:7297/api/pizze";
const dropdownButton = document.querySelector(".dropbtn");
const dropdownContent = document.querySelector(".dropdown-content");
const forms = document.querySelectorAll(".form-container");
const output = document.querySelector(".divOutput");
const formGet = document.getElementById("getForm");
const formPost = document.getElementById("setForm");
const formPut = document.getElementById("putForm");
const formDelete = document.getElementById("deleteForm");

/**
 * Funzione per mostrare l'output nella UI.
 * @param {string} title - Titolo del messaggio.
 * @param {any} data - Dati da mostrare (saranno stringificati in JSON).
 */
function showOutput(title, data = null) {
    output.innerHTML = `
        <div class="outputMessage">
            <h2>${title}</h2>
            ${data ? `<pre>${JSON.stringify(data, null, 2)}</pre>` : ""}
        </div>
    `;
}

/**
 * Funzione di utilità per gestire tutte le chiamate API con fetch.
 * Gestisce l'errore di rete e la verifica res.ok.
 * @param {string} url - URL della risorsa.
 * @param {object} options - Opzioni di fetch (method, headers, body, ecc.).
 * @returns {Promise<any>} - I dati della risposta.
 */
async function apiCall(url, options = {}) {
    try {
        const res = await fetch(url, options);

        // Verifica se la risposta HTTP è un successo (codici 200-299)
        if (!res.ok) {
            // Tenta di leggere il corpo come JSON per un messaggio di errore dettagliato
            const errorText = await res.text();
            let errorMessage = `Errore HTTP ${res.status}: ${res.statusText}`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.detail || JSON.stringify(errorJson, null, 2);
            } catch {
                // Se non è JSON, usa il testo
                if (errorText.trim().length > 0) {
                    errorMessage = errorText;
                }
            }
            throw new Error(errorMessage);
        }

        // Tenta di restituire il JSON o il testo (per DELETE senza contenuto)
        const text = await res.text();
        return text ? JSON.parse(text) : null;
    } catch (err) {
        // Rilancia l'errore per il blocco try...catch specifico del form
        throw new Error(`Errore di rete/API: ${err.message}`);
    }
}

// ----------------------------------------------------
// Gestione Interfaccia Utente (Dropdown e Forms)
// ----------------------------------------------------

// Apre/Chiude il dropdown
dropdownButton.addEventListener("click", e => {
    e.preventDefault();
    dropdownContent.classList.toggle("show");
});

// Nasconde tutti i form e mostra quello selezionato dal dropdown
document.querySelectorAll(".dropdown-content a").forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();

        forms.forEach(f => f.classList.remove("active"));
        const form = document.getElementById(link.dataset.form);
        if (form) form.classList.add("active");

        dropdownContent.classList.remove("show");
    });
});

// Chiude il dropdown se si clicca fuori
document.addEventListener("click", e => {
    if (!e.target.closest(".dropdown")) {
        dropdownContent.classList.remove("show");
    }
});

// ----------------------------------------------------
// Gestione Form API (CRUD)
// ----------------------------------------------------

// ✅ GET: Recupera tutte le pizze
formGet.addEventListener("submit", async e => {
    e.preventDefault();

    try {
        const data = await apiCall(API_URL);
        showOutput("GET eseguito con successo! (Tutte le pizze)", data);
    } catch (err) {
        showOutput("Errore GET:", err.message);
    }
});

// ✅ POST: Crea una nuova pizza
formPost.addEventListener("submit", async e => {
    e.preventDefault();
    
    // Si usa FormData per estrarre tutti i campi
    const formData = new FormData(formPost);

    // Crea l'oggetto pizza escludendo l'ID, che di solito è generato dal server in POST
    const pizza = {
        nome: formData.get("nuovoNome"),
        prezzo: Number(formData.get("nuovoPrezzo")),
        // Assicurarsi che 'prezzo' sia un numero valido
        // Si possono aggiungere qui altre validazioni
    };
    
    // Controllo minimo dei campi
    if (!pizza.nome || isNaN(pizza.prezzo)) {
        return showOutput("Errore POST:", "Nome mancante o Prezzo non valido.");
    }

    try {
        const data = await apiCall(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(pizza)
        });
        showOutput("POST eseguito con successo! (Nuova pizza creata)", data);
        formPost.reset(); // Pulisce il form
    } catch (err) {
        showOutput("Errore POST:", err.message);
    }
});

// ✅ PUT: Aggiorna il prezzo di una pizza
formPut.addEventListener("submit", async e => {
    e.preventDefault();

    const formData = new FormData(formPut);
    const id = formData.get("id");
    const prezzo = Number(formData.get("prezzo")); // Assicurati di usare il nome corretto del campo
    
    if (!id || isNaN(prezzo)) {
        return showOutput("Errore PUT:", "ID mancante o Prezzo non valido!");
    }

    const updateBody = { prezzo }; // Oggetto con solo i campi da aggiornare

    try {
        const data = await apiCall(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(updateBody)
        });
        
        // La PUT può restituire 204 No Content, in quel caso apiCall restituisce null
        showOutput("PUT eseguito con successo!", data || `Pizza con ID ${id} aggiornata.`);
        formPut.reset();
    } catch (err) {
        showOutput("Errore PUT:", err.message);
    }
});

// ✅ DELETE: Elimina una pizza
formDelete.addEventListener("submit", async e => {
    e.preventDefault();

    const id = formDelete.querySelector('input[name="id"]').value;

    if (!id)
        return showOutput("Errore DELETE:", "Inserisci un ID!");

    try {
        await apiCall(`${API_URL}/${id}`, { method: "DELETE" });

        // Se apiCall non ha lanciato errori, la richiesta è andata a buon fine
        showOutput("DELETE eseguito con successo!", `Pizza con ID ${id} eliminata.`);
        formDelete.reset();
    } catch (err) {
        showOutput("Errore DELETE:", err.message);
    }
});
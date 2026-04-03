let operazioneCorrente = null;  
let ordineInModifica = null;
let prodottiAggiunti = [];   

document.addEventListener('DOMContentLoaded', async function() {
    // gestione CSRF token
    const tokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
    if (!tokenElement) {
        console.error('ERRORE: Token CSRF non trovato nel DOM.');
        return;
    }
    const csrf_token = tokenElement.value;
    axios.defaults.headers.common['X-CSRFToken'] = csrf_token;
    
    // carico clienti, prodotti e ordini
    await caricaClienti();
    await caricaProdotti();
    await caricaOrdini();

    // aggiunta prodotto - chiamo aggiungiProdotto()
    document.getElementById('btnAggiungiProdotto').addEventListener('click', aggiungiProdotto);
    
    // annullamento operazione - reset generale, mostro gli ordini
    document.getElementById('btnAnnulla').addEventListener('click', function() {
        resetForm();
        resetOperazioneCorrente();
        mostraDivListaOrdini();
    });

    // creazione ordine - mostro il form 
    document.getElementById('btnNuovoOrdine').addEventListener('click', function() {
        operazioneCorrente = 'create';
        mostraDivOperazione();
        document.getElementById('titoloOperazione').textContent = 'Crea un nuovo ordine';
    });
    
    // submit form
    document.getElementById('formOrdine').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // operazione CREATE
        if (operazioneCorrente === 'create') {
            // controllo che abbia aggiunto almeno un prodotto
            if (prodottiAggiunti.length === 0) {
                alert('Errore! Aggiungi almeno un prodotto.');
                return;
            }
            
            // creo l'oggetto nuovo ordine
            const datiOrdine = {
                cliente: document.getElementById('selectCliente').value,
                data_ordine: document.getElementById('inputData').value,
                dettagli_prodotti: prodottiAggiunti.map(p => ({
                    prodotto: p.prodotto,
                    quantita: p.quantita
                }))
            };

            // dato che stato ha un default, controllo se non è stato inserito niente altrimenti darebbe errore
            const stato = document.getElementById('inputStato').value;
            if(stato) {
                datiOrdine.stato = stato;
            }

            // creo il nuovo ordine passando l'oggetto appena creato, reset generale e aggiorno e mostro gli ordini
            axios.post('/api/ordini/', datiOrdine)
                .then(response => {
                    alert('Successo! Ordine creato');

                    prodottiAggiunti = [];
                    aggiornaListaProdotti();
                    resetForm();
                    resetOperazioneCorrente();
                    caricaOrdini();
                    mostraDivListaOrdini();
                })
                .catch(error => {
                    console.error('Errore: ', error);
                    alert('Errore nella creazione dell\'ordine');
                });

        // operazione UPDATE
        } else if(operazioneCorrente == 'update') {
            // controllo se sto effettivamente modificando un ordine
            if(!ordineInModifica) {
                alert('Errore! Seleziona un ordine da modificare');
                return;
            }

            // controllo se si ha aggiunto almeno un prodotto
            if(prodottiAggiunti.length === 0) {
                alert('Errore! Aggiungi almeno un prodotto');
                return;
            }

            // creo l'oggetto nuovo ordine 
            const datiOrdine = {
                cliente: document.getElementById('selectCliente').value,
                data_ordine: document.getElementById('inputData').value,
                stato: document.getElementById('inputStato').value,
                dettagli_prodotti: prodottiAggiunti.map(p => ({
                    prodotto: p.prodotto,
                    quantita: p.quantita
                }))
            };
            
            // modifico l'ordine passando l'id dell'ordine in modifica e l'oggetto appena creato
            axios.put(`/api/ordini/${ordineInModifica}/`, datiOrdine)
                .then(response => {
                    alert('Ordine modificato con successo!');

                    // reset generale e mostro gli ordini
                    prodottiAggiunti = [];
                    aggiornaListaProdotti();
                    resetForm();
                    resetOperazioneCorrente();
                    caricaOrdini();
                    mostraDivListaOrdini();
                })
                .catch(error => {
                    console.error('Errore:', error);
                    alert('Errore nella modifica dell\'ordine');
                });

        }
    });
});

// carico i clienti nel menu a tendina
async function caricaClienti() {
    try {
        // prendo i clienti
        const response = await axios.get('/api/clienti/') 
        const select = document.getElementById('selectCliente');
        select.innerHTML = '<option value="">Seleziona cliente</option>';

        // per ogni cliente creo una option e la aggiungo alla select
        response.data.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = cliente.email;
            select.appendChild(option);
        });
    }catch(error){
        console.error('Errore:', error);
        alert('Errore nel caricamento dei clienti');
    } 
}

// carico i prodotti nel menu a tendina
async function caricaProdotti() {
    try {
        // prendo i prodotti
        const response = await axios.get('/api/prodotti/')
        const select = document.getElementById('selectProdotto');
        select.innerHTML = '<option value="">Seleziona prodotto</option>';
            
        // per ogni prodotto creo una option e la aggiungo alla select
        response.data.forEach(prodotto => {
            const option = document.createElement('option');
            option.value = prodotto.id;
            option.textContent = `${prodotto.nome} - €${prodotto.prezzo}`;
            select.appendChild(option);
        });
    } catch(error){
        console.error('Errore:', error);
        alert('Errore nel caricamento dei prodotti');
    }  
}

//carico gli ordini nella tabella
async function caricaOrdini() {
    try {
        // prendo gli ordini
        const response = await axios.get('/api/ordini/')
        const tbody = document.getElementById('tabellaOrdini');
        tbody.innerHTML = '';
        
        // controllo se non ci sono ordini
        if (response.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nessun ordine trovato</td></tr>';
            return;
        }
            
        // per ogni ordine vado a impostare il record della tabella
        response.data.forEach(ordine => {
            // devo creare la lista dei prodotti
            let prodottiString = '';
            // controllo che ci siano prodotti nell'ordine
            if (ordine.dettagli && ordine.dettagli.length > 0) {
                // se ci sono, creo la lista dei prodotti separati da una ,
                prodottiString = ordine.dettagli.map(d => `${d.prodotto_nome} (x${d.quantita})`).join(', ');
            } else {
                prodottiString = 'Nessun prodotto';
            }
  
            // ora devo creare il record
            const tr = document.createElement('tr');
                
            // creo il contenuto del record coi dati dell'ordine
            tr.innerHTML = `
                <td>${ordine.id}</td>
                <td>${ordine.cliente_email}</td>
                <td>${prodottiString}</td>
                <td>${ordine.data_ordine}</td>
                <td>
                    <span class="badge ${ordine.stato == 'in_attesa' ? 'bg-warning' 
                                        : ordine.stato == 'spedito' ? 'bg-primary'
                                        : ordine.stato == 'consegnato' ? 'bg-success'
                                        : 'bg-danger'}">
                        ${ordine.stato_display}
                    </span>
                </td>
                <td class="pe-0">
                    <button class="btn btn-sm btn-danger" onclick="eliminaOrdine(${ordine.id})">
                            Elimina
                    </button>
                </td>
                <td class="ps-0">
                    <button class="btn btn-sm btn-info" onclick="modificaOrdine(${ordine.id})">
                        Modifica
                    </button>
                </td>
            `;
                
            tbody.appendChild(tr);
        });
    }catch(error) {
        console.error('Errore:', error);
        alert('Errore nel caricamento degli ordini');
    }
}

// quando clicco il bottone '+Aggiungi'
function aggiungiProdotto() {
    const prodottoId = document.getElementById('selectProdotto').value;
    const quantita = document.getElementById('inputQuantita').value;

    // controllo se è stato selezionato il prodotto
    if(!prodottoId) {
        alert('Errore! Nessun prodotto selezionato.');
        return;
    }

    // controllo se la quantità è valida
    if(!quantita || quantita < 1) {
        alert('Errore! La quantità non può essere minore di 1.');
        return;
    }

    const select = document.getElementById('selectProdotto');

    // ottengo il nome del prodotto e il prezzo
    const prodottoTestoCompleto = select.options[select.selectedIndex].text;
    const parti = prodottoTestoCompleto.split(' - €');
    const prodottoNome = parti[0];
    const prezzo = parseFloat(parti[1]);

    // controllo se è già stato aggiunto all'ordine
    const esistente = prodottiAggiunti.find(p => p.prodotto == prodottoId);
    if(esistente) {
        alert('Prodotto già aggiunto! Rimuovilo se vuoi cambiare la quantità.');
        return;
    }

    // se non lo è, aggiungo i dettagli alla lista dei prodotti
    prodottiAggiunti.push({
        prodotto: parseInt(prodottoId),
        quantita: parseInt(quantita),
        nome: prodottoNome,
        prezzo_unitario: prezzo
    });

    // aggiorno la lista dei prodotti
    aggiornaListaProdotti();

    document.getElementById('selectProdotto').value = '';
    document.getElementById('inputQuantita').value = '1';
}

// rimuovo il prodotto selezionato e aggiorno la lista dei prodotti
function rimuoviProdotto(prodottoId) {
    prodottiAggiunti = prodottiAggiunti.filter(p => p.prodotto != prodottoId);
    aggiornaListaProdotti();
}

// aggiorno la lista dei prodotti
function aggiornaListaProdotti() {
    const lista = document.getElementById('listaProdotti');
    const div = document.getElementById('divListaProdotti');

    // controllo se non ci sono più prodotti nella lista
    if(prodottiAggiunti.length === 0) {
        div.classList.add('d-none');
        lista.innerHTML = '';
        return;
    }

    div.classList.remove('d-none');
    lista.innerHTML = '';

    // creo la lista dei prodotti
    prodottiAggiunti.forEach(prodotto => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';

        li.innerHTML = `
            <span>x${prodotto.quantita} ${prodotto.nome} - €${prodotto.prezzo_unitario}</span>
            <button type="button" class="btn btn-sm btn-danger" onclick="rimuoviProdotto(${prodotto.prodotto})">Rimuovi</button>
        `;
        lista.appendChild(li);
    })
}

// carico i dati dell'ordine selezionato nel form
async function caricaDatiOrdine(id) {
    try {
        // prendo l'ordine da modificare
        const response = await axios.get(`/api/ordini/${id}/`)
        const ordine = response.data;
        
        ordineInModifica = id;
                
        document.getElementById('selectCliente').value = ordine.cliente;
        document.getElementById('inputData').value = ordine.data_ordine;
        document.getElementById('inputStato').value = ordine.stato;
        document.getElementById('titoloOperazione').textContent = 'Modifica un ordine';

        // creo la lista dei prodotti aggiunti all'ordine
        prodottiAggiunti = ordine.dettagli.map(d => ({
            prodotto: d.prodotto,
            quantita: d.quantita,
            nome: d.prodotto_nome,
            prezzo_unitario: d.prezzo_unitario
        }));

        // aggiorno
        aggiornaListaProdotti();
        
    }catch (error) {
        console.error('Errore:', error);
        alert('Errore nel caricamento dell\'ordine');
    }  
}

// carico di dati dell'ordine che voglio modificare
async function modificaOrdine(id) {
    operazioneCorrente = 'update';
    await caricaDatiOrdine(id);
    mostraDivOperazione();

}

function resetOperazioneCorrente() {
    operazioneCorrente = null;
}

function resetForm() {
    document.getElementById('formOrdine').reset();
    prodottiAggiunti = [];
    aggiornaListaProdotti();
    ordineInModifica = null;
}

function mostraDivListaOrdini() {
    document.getElementById('divOperazione').classList.remove('d-block');
    document.getElementById('divOperazione').classList.add('d-none');
    document.getElementById('divListaOrdini').classList.remove('d-none');
}

function mostraDivOperazione() {
    document.getElementById('divListaOrdini').classList.remove('d-block');
    document.getElementById('divListaOrdini').classList.add('d-none');
    document.getElementById('divOperazione').classList.remove('d-none');
}

async function eliminaOrdine(id) {
    if(!confirm('Sei sicuro di voler eliminare questo ordine?')) {
        return;
    }

    try {
        await axios.delete(`/api/ordini/${id}/`)
        await caricaOrdini();
        alert('Ordine eliminato con successo!');
    } catch(error) {
        console.error('Errore:', error);
        alert('Errore durante l\'eliminazione dell\'ordine');
    }
}
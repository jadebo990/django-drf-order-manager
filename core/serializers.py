
from rest_framework import serializers
from .models import Ordine, OrdineProdotto, Cliente, Prodotto


class OrdineProdottoSerializer(serializers.ModelSerializer):
    prodotto_nome = serializers.CharField(
        source = 'prodotto.nome',
        read_only = True
    )

    class Meta:
        model = OrdineProdotto
        fields = ['prodotto', 'prodotto_nome', 'quantita', 'prezzo_unitario']
        read_only_fields = ['prezzo_unitario']

# il serializer converte i dati da JSON a Python e viceversa
class OrdineSerializer(serializers.ModelSerializer):
    # parametri aggiuntivi per la visualizzazione degli ordini (read only)
    # voglio mostrare dati aggiuntivi oltre a data_ordine, stato e cliente
    cliente_email = serializers.EmailField(
        # accedo alla voce cliente dell'ordine
        source = 'cliente.email', 
        read_only = True
    )
    dettagli = OrdineProdottoSerializer(
        source = 'dettagli_prodotti',
        many = True,
        read_only = True
    )
    # senza get_stato_display, vedrei solo il valore salvato nel db e non la versione leggibile
    # per prendere la versione leggibile, django genera il metodo get_NOMECAMPO_display()
    stato_display = serializers.CharField(
        source = 'get_stato_display',
        read_only = True
    )

    # PrimaryKeyRelatedField in GET restituisce l'id del cliente e in POST o PUT inserisce l'id come stringa nel db
    # invece serve un oggetto cliente, che recupera dal queryset definito
    cliente = serializers.PrimaryKeyRelatedField(queryset=Cliente.objects.all())

    # dettagli_prodotti rappresenta la lista degli OrdineProdotto associati a un certo ordine nel momento in cui sto creando/modificando un ordine (write only)
    dettagli_prodotti = OrdineProdottoSerializer(
        many = True,
        write_only = True
    )

    # specifico il modello da serializzare
    # con fields specifico i campi da includere nel JSON (Python -> JSON) o quelli da aspettarsi nel JSON (JSON -> Python)
    class Meta:
        model = Ordine
        fields = ['id', 'cliente', 'cliente_email', 'data_ordine', 'stato', 'stato_display', 'dettagli', 'dettagli_prodotti']

    # sovrascrivo la funzione per la creazione di un nuovo ordine 
    # perchè oltre a creare l'ordine (data_ordine,stato,cliente), devo anche gestire i suoi dettagli (OrdineProdotto)
    def create(self, validated_data):
        # tolgo dai dati in arrivo i dettagli_prodotti (perchè non c'è come campo dentro Ordine)
        dettagli_prodotti = validated_data.pop('dettagli_prodotti')
        # creo l'ordine con solo i dati necessari
        ordine = Ordine.objects.create(**validated_data)

        # ora creo i vari dettagli dei prodotti di quell'ordine
        for dettaglio in dettagli_prodotti:
            prodotto = dettaglio['prodotto']
            OrdineProdotto.objects.create(
                ordine = ordine,
                prodotto = prodotto,
                quantita = dettaglio['quantita'],
                prezzo_unitario = prodotto.prezzo
            )
        return ordine

    # sovrascrivo la funzione per la modifica di un ordine 
    # perchè devo gestire il dato aggiuntivo dei dettagli prodotti oltre a modificare l'ordine
    def update(self, instance, validated_data):
        # estraggo i dettagli sui prodotti (uso None così se non modifico alcun OrdineProdotto, non mi da errore)
        dettagli_prodotti = validated_data.pop('dettagli_prodotti', None)

        # sostituisco i dati dell'ordine con i nuovi dati
        # instance è l'ordine corrente e validated_data rappresenta i dati in JSON in arrivo
        # il secondo parametro instance.cliente serve come valore di default se cliente fosse vuoto, così tiene quello già in db
        # nella create() non mi serve perchè obbligatoriamente mi servono tutti i campi
        instance.cliente = validated_data.get('cliente', instance.cliente)
        instance.data_ordine = validated_data.get('data_ordine', instance.data_ordine)
        instance.stato = validated_data.get('stato', instance.stato)
        instance.save()

        # se è stata fatta anche solo una modifica ai dettagli 
        if dettagli_prodotti is not None:
            # prima cancello quelli attuali
            instance.dettagli_prodotti.all().delete()

            # e poi per ogni nuovo dettaglio, creo il corrispettivo record nel db
            for dettaglio in dettagli_prodotti:
                prodotto = dettaglio['prodotto']

                OrdineProdotto.objects.create(
                    ordine = instance,
                    prodotto = prodotto,
                    quantita = dettaglio['quantita'],
                    prezzo_unitario = prodotto.prezzo
                )
        
        return instance

class ProdottoSerializer(serializers.ModelSerializer):
    # con __all__ prendo direttamente tutti i campi
    class Meta:
        model = Prodotto
        fields = '__all__'

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'
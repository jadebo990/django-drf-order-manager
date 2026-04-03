from django.db import models

class Cliente(models.Model):
    nome = models.CharField(max_length = 50)
    cognome = models.CharField(max_length = 50)
    email = models.EmailField()
    telefono = models.CharField(max_length = 13)

    def __str__(self):
        return self.email

class Prodotto(models.Model):
    nome = models.CharField(max_length = 50)
    descrizione = models.TextField()
    prezzo = models.DecimalField(
        max_digits = 5,
        decimal_places = 2
    )

    def __str__(self):
        return self.nome
    
class Ordine(models.Model):
    class StatoOrdine(models.TextChoices):
        #           valore db  ,  valore leggibile
        IN_ATTESA = 'in_attesa', 'In Attesa'
        SPEDITO = 'spedito', 'Spedito'
        CONSEGNATO = 'consegnato', 'Consegnato'
        CANCELLATO = 'cancellato', 'Cancellato'

    cliente = models.ForeignKey(
        Cliente, 
        on_delete = models.CASCADE, 
        related_name = 'ordini_cliente'
    )
    # relazione ManyToMany verso Prodotto, tramite la tabella OrdineProdoto (senza through avrebbe creato una tabella intermedia con solo gli id)
    prodotti = models.ManyToManyField(
        Prodotto, 
        through = 'OrdineProdotto'
    )
    data_ordine = models.DateField()
    stato = models.CharField(
        max_length = 10,
        choices = StatoOrdine.choices,
        default = StatoOrdine.IN_ATTESA
    )

    def __str__(self):
        return str(self.id)


class OrdineProdotto(models.Model):
    # la combinazione di ordine + prodotto deve essere unica
    # uso UniqueConstraint perchè è lo standard moderno rispetto a unique_together
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['ordine', 'prodotto'],
                name='unique_ordine_prodotto'
            )
        ]

    # dettagli_prodotti è il collegamento tra un OrdineProdotto e un Ordine
    # da un oggetto x Ordine posso accedere ai suoi dettagli sui prodotti (cioè tutti gli OrdineProdotto con ordine = x.id)
    ordine = models.ForeignKey(
        Ordine,
        on_delete = models.CASCADE,
        related_name = 'dettagli_prodotti'
    )
    prodotto = models.ForeignKey(
        Prodotto,
        on_delete = models.CASCADE,
        related_name = 'ordini_prodotto'
    )
    quantita = models.PositiveIntegerField()
    prezzo_unitario = models.DecimalField(
        max_digits = 5,
        decimal_places = 2
    )

    def __str__(self):
        return f"{self.ordine}, {self.prodotto}"


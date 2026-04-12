from rest_framework import viewsets
from django.views.generic import TemplateView
from .serializers import OrdineSerializer, ClienteSerializer, ProdottoSerializer
from .models import Ordine, Cliente, Prodotto
from rest_framework.permissions import AllowAny

# uso la CBV TemplateView perchè è la più corretta per renderizzare un template senza logica aggiuntiva
class HomeTemplateView(TemplateView):
    template_name = 'core/home.html'

class OrdineTemplateView(TemplateView):
    template_name = 'core/ordini.html'

# uso i ViewSets perchè mi forniscono tutte le operazioni CRUD "in automatico"
class OrdineViewSet(viewsets.ModelViewSet):
    # dati in pasto al ViewSet
    queryset = Ordine.objects.all()
    # serializer che converte i dati in JSON e viceversa
    serializer_class = OrdineSerializer
    
    # chiunque può accedere agli endpoint creati dal viewset senza autenticazione
    # questo sovrascrive la configurazione in settings.py dentro REST_FRAMEWORK[]
    permission_classes = [AllowAny]

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [AllowAny]
    
class ProdottoViewSet(viewsets.ModelViewSet):
    queryset = Prodotto.objects.all()
    serializer_class = ProdottoSerializer
    permission_classes = [AllowAny]
   
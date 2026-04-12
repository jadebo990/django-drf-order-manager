from django.urls import include, path
from core import views
from rest_framework.routers import DefaultRouter

# DefaultRouter() mi genera tutti gli endpoint REST per ogni viewset registrato
router = DefaultRouter()

router.register(r'ordini', views.OrdineViewSet)
router.register(r'clienti', views.ClienteViewSet)
router.register(r'prodotti', views.ProdottoViewSet)

urlpatterns = [
    path("", views.HomeTemplateView.as_view(), name='home'),
    path("ordini/", views.OrdineTemplateView.as_view(), name='ordini'), 
    path("api/", include(router.urls)),
]
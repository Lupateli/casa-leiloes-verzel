from django.contrib import admin
from django.urls import path
from auctions.views import health_check, ListaLotesView

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/health/", health_check, name="health_check"),
    path("api/lotes/", ListaLotesView.as_view(), name="lista_lotes"),
]

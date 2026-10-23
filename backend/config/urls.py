from django.contrib import admin
from django.urls import path, include
from auctions.views import (
    health_check,
    ListaLotesView,
    buscar_livros_view,
    CriarLoteView,
    CriarLanceView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/health/", health_check, name="health_check"),
    path("api/lotes/", ListaLotesView.as_view(), name="lista_lotes"),
    path("api/livros/buscar/", buscar_livros_view),
    path("api/lotes/criar/", CriarLoteView.as_view()),
    path("api/lances/criar/", CriarLanceView.as_view()),
    path("api-auth/", include("rest_framework.urls")),
]

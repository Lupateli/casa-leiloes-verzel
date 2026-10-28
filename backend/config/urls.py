from django.contrib import admin
from django.urls import path, include
from auctions.views import (
    health_check,
    ListaLotesView,
    buscar_livros_view,
    CriarLoteView,
    CriarLanceView,
    auditar_historico_view,
    encerrar_leilao_view,  
    ListaComprovantesView,
    HistoricoLancesView,
    DepositarSaldoView,
    LoginView,
    CadastroView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/health/", health_check, name="health_check"),
    path("api/lotes/", ListaLotesView.as_view(), name="lista_lotes"),
    path("api/livros/buscar/", buscar_livros_view),
    path("api/lotes/criar/", CriarLoteView.as_view()),
    path("api/lances/criar/", CriarLanceView.as_view()),
    path("api-auth/", include("rest_framework.urls")),
    path("api/lotes/<int:lote_id>/auditoria/", auditar_historico_view,),
    path("api/lotes/<int:lote_id>/encerrar/", encerrar_leilao_view, name="encerrar_leilao",),
    path("api/comprovantes/", ListaComprovantesView.as_view(), name="lista_comprovantes",),
    path("api/lotes/<int:lote_id>/lances/", HistoricoLancesView.as_view(), name="historico_lances",),
    path("api/carteira/depositar/", DepositarSaldoView.as_view(), name="depositar-saldo",),
    path("api/login/", LoginView.as_view(), name="login"),
    path("api/cadastro/", CadastroView.as_view(), name="cadastro"),
]

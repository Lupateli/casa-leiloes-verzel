from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Usuario, Lote, Carteira, Lance, Comprovante


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Dados do leilão", {"fields": ("tipo",)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Dados do leilão", {"fields": ("tipo",)}),
    )


@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
    list_display = (
        "nome",
        "leiloeiro",
        "lance_inicial",
        "status",
        "inicio",
        "encerramento",
    )
    list_filter = ("status",)
    search_fields = ("nome", "descricao")


@admin.register(Carteira)
class CarteiraAdmin(admin.ModelAdmin):
    list_display = ("usuario", "saldo_disponivel", "saldo_reservado")


@admin.register(Lance)
class LanceAdmin(admin.ModelAdmin):
    list_display = ("lote", "participante", "valor", "criado_em")
    list_filter = ("criado_em",)


@admin.register(Comprovante)
class ComprovanteAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "lote",
        "vencedor",
        "leiloeiro",
        "valor_pago",
        "gerado_em",
    )
    readonly_fields = (
        "lote",
        "vencedor",
        "leiloeiro",
        "valor_pago",
        "gerado_em",
    )
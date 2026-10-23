
from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    LEILOEIRO = "LEILOEIRO"
    PARTICIPANTE = "PARTICIPANTE"

    TIPOS_USUARIO = [
        (LEILOEIRO, "Leiloeiro"),
        (PARTICIPANTE, "Participante"),
    ]

    tipo = models.CharField(
        max_length=20,
        choices=TIPOS_USUARIO,
        default=PARTICIPANTE,
    )

    def __str__(self):
        return self.username


class Lote(models.Model):
    class Status(models.TextChoices):
        AGENDADO = "AGENDADO", "Agendado"
        ABERTO = "ABERTO", "Aberto"
        ENCERRADO = "ENCERRADO", "Encerrado"
        CANCELADO = "CANCELADO", "Cancelado"

    leiloeiro = models.ForeignKey(
        "auctions.Usuario",
        on_delete=models.PROTECT,
        related_name="lotes_criados",
        limit_choices_to={"tipo": "LEILOEIRO"},
    )
    nome = models.CharField(max_length=200)
    descricao = models.TextField(blank=True)
    imagem_url = models.URLField(blank=True)
    api_item_id = models.CharField(max_length=100, blank=True)

    lance_inicial = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    incremento_minimo = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    inicio = models.DateTimeField()
    encerramento = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AGENDADO,
    )

    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nome


class Carteira(models.Model):
    usuario = models.OneToOneField(
        "auctions.Usuario",
        on_delete=models.PROTECT,
        related_name="carteira",
    )
    saldo_disponivel = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=10000.00,
    )
    saldo_reservado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    def __str__(self):
        return f"Carteira de {self.usuario.username}"


class Lance(models.Model):
    lote = models.ForeignKey(
        Lote,
        on_delete=models.PROTECT,
        related_name="lances",
    )
    participante = models.ForeignKey(
        "auctions.Usuario",
        on_delete=models.PROTECT,
        related_name="lances",
    )
    valor = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    hash_anterior = models.CharField(max_length=64, blank=True)
    hash_atual = models.CharField(max_length=64)

    class Meta:
        ordering = ["criado_em", "id"]

    def __str__(self):
        return f"Lance de R$ {self.valor} no lote {self.lote_id}"


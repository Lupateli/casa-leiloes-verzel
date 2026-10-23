from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import Carteira, Lance, Lote


@transaction.atomic
def registrar_lance(*, lote_id, participante, valor):
    valor = Decimal(str(valor))

    if valor <= 0:
        raise ValidationError(
            {"valor": "O lance deve ser maior que zero."}
        )

    lote = Lote.objects.select_for_update().filter(
        id=lote_id
    ).first()

    if lote is None:
        raise ValidationError({"lote": "Lote não encontrado."})

    agora = timezone.now()

    if lote.status != Lote.Status.ABERTO:
        raise ValidationError(
            {"lote": "Este lote não está aberto para lances."}
        )

    if not (lote.inicio <= agora < lote.encerramento):
        raise ValidationError(
            {"lote": "O lote está fora do período de lances."}
        )

    if participante.tipo != "PARTICIPANTE":
        raise ValidationError(
            {"participante": "Somente participantes podem dar lances."}
        )

    ultimo_lance = (
        Lance.objects.filter(lote=lote)
        .order_by("-criado_em", "-id")
        .first()
    )

    if ultimo_lance:
        if ultimo_lance.participante_id == participante.id:
            raise ValidationError(
                {"valor": "Você já é o líder deste lote."}
            )

        valor_minimo = (
            ultimo_lance.valor + lote.incremento_minimo
        )
    else:
        valor_minimo = lote.lance_inicial

    if valor < valor_minimo:
        raise ValidationError({
            "valor": f"O lance mínimo permitido é R$ {valor_minimo:.2f}."
        })

    carteira, _ = Carteira.objects.get_or_create(
        usuario=participante
    )
    carteira = Carteira.objects.select_for_update().get(
        pk=carteira.pk
    )

    if carteira.saldo_disponivel < valor:
        raise ValidationError(
            {"saldo": "Saldo disponível insuficiente."}
        )

    carteira_anterior = None

    if ultimo_lance:
        carteira_anterior, _ = Carteira.objects.get_or_create(
            usuario=ultimo_lance.participante
        )

        carteira_anterior = Carteira.objects.select_for_update().get(
            pk=carteira_anterior.pk
        )

        carteira_anterior.saldo_disponivel += ultimo_lance.valor
        carteira_anterior.saldo_reservado -= ultimo_lance.valor

        carteira_anterior.save(update_fields=[
            "saldo_disponivel",
            "saldo_reservado",
        ])

    carteira.saldo_disponivel -= valor
    carteira.saldo_reservado += valor
    carteira.save(update_fields=[
        "saldo_disponivel",
        "saldo_reservado",
    ])

    lance = Lance.objects.create(
        lote=lote,
        participante=participante,
        valor=valor,
        hash_anterior="",
        hash_atual="",
    )

    return lance

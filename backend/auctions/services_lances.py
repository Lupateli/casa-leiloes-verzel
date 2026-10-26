import hashlib
import json

from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from datetime import timedelta

from .models import Carteira, Lance, Lote


def gerar_hash_lance(lote_id, participante_id, valor, criado_em, hash_anterior):
    dados = {
        "lote_id": lote_id,
        "participante_id": participante_id,
        "valor": str(valor),
        "criado_em": criado_em.isoformat(),
        "hash_anterior": hash_anterior,
    }

    conteudo = json.dumps(
        dados,
        sort_keys=True,
        ensure_ascii=False
    )

    return hashlib.sha256(conteudo.encode("utf-8")).hexdigest()

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

    if valor <= valor_minimo:
        raise ValidationError({
            "valor": f"O lance deve ser maior que R$ {valor_minimo:.2f}."
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

    # Define o hash anterior
    if ultimo_lance and ultimo_lance.hash_atual:
        hash_anterior = ultimo_lance.hash_atual
    else:
        hash_anterior = ""

    # Define o horário do novo lance
    criado_em = timezone.now()

    # Gera o hash do novo lance
    hash_atual = gerar_hash_lance(
        lote_id=lote.id,
        participante_id=participante.id,
        valor=valor,
        criado_em=criado_em,
        hash_anterior=hash_anterior,
    )

    # Salva o lance com os hashes
    lance = Lance.objects.create(
        lote=lote,
        participante=participante,
        valor=valor,
        criado_em=criado_em,
        hash_anterior=hash_anterior,
        hash_atual=hash_atual,
    )
    tempo_restante = lote.encerramento - criado_em

    if tempo_restante <= timedelta(minutes=2):
        lote.encerramento += timedelta(minutes=2)
        lote.save(update_fields=["encerramento"])

    return lance

def verificar_historico(lote_id):
    lances = Lance.objects.filter(
        lote_id=lote_id
    ).order_by("criado_em", "id")

    hash_anterior_esperado = ""

    for lance in lances:
        if lance.hash_anterior != hash_anterior_esperado:
            return {
                "integro": False,
                "lance_id": lance.id,
                "motivo": "O hash anterior não corresponde ao histórico."
            }

        hash_calculado = gerar_hash_lance(
            lote_id=lance.lote_id,
            participante_id=lance.participante_id,
            valor=lance.valor,
            criado_em=lance.criado_em,
            hash_anterior=lance.hash_anterior,
        )

        if lance.hash_atual != hash_calculado:
            return {
                "integro": False,
                "lance_id": lance.id,
                "motivo": "Os dados do lance foram alterados."
            }

        hash_anterior_esperado = lance.hash_atual

    return {
        "integro": True,
        "mensagem": "O histórico de lances está íntegro."
    }
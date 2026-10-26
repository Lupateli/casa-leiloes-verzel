from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import Carteira, Comprovante, Lance, Lote


@transaction.atomic
def encerrar_leilao(lote_id):
    try:
        lote = Lote.objects.select_for_update().get(id=lote_id)
    except Lote.DoesNotExist:
        raise ValidationError("Lote não encontrado.")

    if lote.status == Lote.Status.ENCERRADO:
        raise ValidationError("Este leilão já foi encerrado.")

    if lote.status != Lote.Status.ABERTO:
        raise ValidationError("Este leilão não está aberto.")

    if timezone.now() < lote.encerramento:
        raise ValidationError("O horário do leilão ainda não terminou.")

    lance_vencedor = (
        Lance.objects
        .filter(lote=lote)
        .order_by("-valor", "-criado_em", "-id")
        .first()
    )

    if lance_vencedor is None:
        lote.status = Lote.Status.ENCERRADO
        lote.save(update_fields=["status"])
        return None

    valor_final = lance_vencedor.valor

    carteira_vencedor = Carteira.objects.select_for_update().get(
        usuario=lance_vencedor.participante
    )

    carteira_leiloeiro, _ = Carteira.objects.get_or_create(
        usuario=lote.leiloeiro
    )
    carteira_leiloeiro = Carteira.objects.select_for_update().get(
        id=carteira_leiloeiro.id
    )

    if carteira_vencedor.saldo_reservado < valor_final:
        raise ValidationError(
            "O saldo reservado do vencedor é insuficiente para concluir o pagamento."
        )

    carteira_vencedor.saldo_reservado -= valor_final
    carteira_vencedor.save(update_fields=["saldo_reservado"])

    carteira_leiloeiro.saldo_disponivel += valor_final
    carteira_leiloeiro.save(update_fields=["saldo_disponivel"])

    comprovante = Comprovante.objects.create(
        lote=lote,
        vencedor=lance_vencedor.participante,
        leiloeiro=lote.leiloeiro,
        valor_pago=valor_final,
    )

    lote.status = Lote.Status.ENCERRADO
    lote.save(update_fields=["status"])

    return comprovante
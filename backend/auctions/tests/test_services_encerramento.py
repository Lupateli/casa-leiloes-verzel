from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from auctions.models import Usuario, Lote, Carteira, Comprovante
from auctions.services_lances import registrar_lance
from auctions.services_encerramento import encerrar_leilao


class TesteEncerramentoLeilao(TestCase):

    def setUp(self):
        agora = timezone.now()

        self.leiloeiro = Usuario.objects.create_user(
            username="leiloeiro_teste",
            password="teste123",
            tipo="LEILOEIRO",
        )

        self.participante = Usuario.objects.create_user(
            username="participante_teste",
            password="teste123",
            tipo="PARTICIPANTE",
        )

        self.carteira_vencedor = Carteira.objects.create(
            usuario=self.participante,
            saldo_disponivel=Decimal("100.00"),
            saldo_reservado=Decimal("0.00"),
        )

        self.carteira_leiloeiro = Carteira.objects.create(
            usuario=self.leiloeiro,
            saldo_disponivel=Decimal("0.00"),
            saldo_reservado=Decimal("0.00"),
        )

        self.lote = Lote.objects.create(
            leiloeiro=self.leiloeiro,
            nome="Livro de teste",
            lance_inicial=Decimal("50.00"),
            incremento_minimo=Decimal("5.00"),
            inicio=agora - timedelta(minutes=10),
            encerramento=agora + timedelta(hours=1),
            status=Lote.Status.ABERTO,
        )

    def finalizar_horario_lote(self):
        self.lote.encerramento = timezone.now() - timedelta(minutes=1)
        self.lote.save(update_fields=["encerramento"])

    def test_encerramento_realiza_pagamento_e_gera_comprovante(self):
        # Registra um lance antes de encerrar.
        registrar_lance(
            lote_id=self.lote.id,
            participante=self.participante,
            valor=Decimal("51.00"),
        )

        self.finalizar_horario_lote()
        comprovante = encerrar_leilao(self.lote.id)

        self.assertIsNotNone(comprovante)
        self.assertEqual(comprovante.vencedor, self.participante)
        self.assertEqual(comprovante.leiloeiro, self.leiloeiro)
        self.assertEqual(comprovante.valor_pago, Decimal("51.00"))

        self.carteira_vencedor.refresh_from_db()
        self.carteira_leiloeiro.refresh_from_db()
        self.lote.refresh_from_db()

        self.assertEqual(
            self.carteira_vencedor.saldo_reservado,
            Decimal("0.00"),
        )
        self.assertEqual(
            self.carteira_leiloeiro.saldo_disponivel,
            Decimal("51.00"),
        )
        self.assertEqual(self.lote.status, Lote.Status.ENCERRADO)
        self.assertEqual(Comprovante.objects.count(), 1)

    def test_encerramento_sem_lances_nao_gera_comprovante(self):
        self.finalizar_horario_lote()
        resultado = encerrar_leilao(self.lote.id)

        self.assertIsNone(resultado)

        self.lote.refresh_from_db()

        self.assertEqual(self.lote.status, Lote.Status.ENCERRADO)
        self.assertEqual(Comprovante.objects.count(), 0)

    def test_nao_permite_encerrar_duas_vezes(self):
        registrar_lance(
            lote_id=self.lote.id,
            participante=self.participante,
            valor=Decimal("51.00"),
        )

        self.finalizar_horario_lote()
        encerrar_leilao(self.lote.id)

        with self.assertRaises(ValidationError):
            encerrar_leilao(self.lote.id)

        self.assertEqual(Comprovante.objects.count(), 1)
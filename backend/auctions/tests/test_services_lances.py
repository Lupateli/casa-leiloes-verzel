from datetime import timedelta
from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from unittest.mock import patch
from auctions.models import Usuario, Lote, Carteira, Lance
from auctions.services_lances import registrar_lance, verificar_historico



class TesteRegistroLances(TestCase):

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

        self.lote = Lote.objects.create(
            leiloeiro=self.leiloeiro,
            nome="Livro de teste",
            lance_inicial=Decimal("50.00"),
            incremento_minimo=Decimal("5.00"),
            inicio=agora - timedelta(minutes=10),
            encerramento=agora + timedelta(hours=1),
            status=Lote.Status.ABERTO,
        )

        self.carteira = Carteira.objects.create(
            usuario=self.participante,
            saldo_disponivel=Decimal("100.00"),
            saldo_reservado=Decimal("0.00"),
        )

    def test_aceita_lance_valido(self):
        lance = registrar_lance(
            lote_id=self.lote.id,
            participante=self.participante,
            valor=Decimal("51.00"),
        )

        self.assertEqual(lance.valor, Decimal("51.00"))

        self.carteira.refresh_from_db()
        self.assertEqual(
            self.carteira.saldo_disponivel,
            Decimal("49.00"),
        )
        self.assertEqual(
            self.carteira.saldo_reservado,
            Decimal("51.00"),
        )

    def test_rejeita_lance_acima_do_saldo(self):
        with self.assertRaises(ValidationError):
            registrar_lance(
                lote_id=self.lote.id,
                participante=self.participante,
                valor=Decimal("150.00"),
            )

        self.assertEqual(Lance.objects.count(), 0)

    def test_lider_nao_pode_dar_outro_lance(self):
        registrar_lance(
            lote_id=self.lote.id,
            participante=self.participante,
            valor=Decimal("51.00"),
        )

        with self.assertRaises(ValidationError):
            registrar_lance(
                lote_id=self.lote.id,
                participante=self.participante,
                valor=Decimal("55.00"),
            )

        self.assertEqual(Lance.objects.count(), 1)


    def test_rejeita_lance_igual_ao_minimo_permitido(self):
        registrar_lance(
            lote_id=self.lote.id,
            participante=self.participante,
            valor=Decimal("51.00"),
        )

        outro_participante = Usuario.objects.create_user(
            username="outro_participante",
            password="teste123",
            tipo="PARTICIPANTE",
        )

        Carteira.objects.create(
            usuario=outro_participante,
            saldo_disponivel=Decimal("100.00"),
            saldo_reservado=Decimal("0.00"),
        )

        with self.assertRaises(ValidationError):
            registrar_lance(
                lote_id=self.lote.id,
                participante=outro_participante,
                valor=Decimal("56.00"),
            )

        self.assertEqual(Lance.objects.count(), 1)


    def test_historico_integro(self):
        registrar_lance(
            lote_id=self.lote.id,
            participante=self.participante,
            valor=Decimal("51.00"),
        )

        resultado = verificar_historico(self.lote.id)

        self.assertTrue(resultado["integro"])
        self.assertEqual(
            resultado["mensagem"],
            "O histórico de lances está íntegro.",
        )

    def test_detecta_alteracao_no_lance(self):
        lance = registrar_lance(
            lote_id=self.lote.id,
            participante=self.participante,
            valor=Decimal("51.00"),
        )

        # Simula uma adulteração sem atualizar os hashes.
        Lance.objects.filter(id=lance.id).update(
            valor=Decimal("60.00")
        )

        resultado = verificar_historico(self.lote.id)

        self.assertFalse(resultado["integro"])
        self.assertEqual(resultado["lance_id"], lance.id)
        self.assertEqual(
            resultado["motivo"],
            "Os dados do lance foram alterados.",
        )
        
    def test_detecta_exclusao_de_lance(self):
        lance = registrar_lance(
            lote_id=self.lote.id,
            participante=self.participante,
            valor=Decimal("51.00"),
        )

        # Simula a exclusão de um lance sem atualizar o histórico.
        Lance.objects.filter(id=lance.id).delete()

        resultado = verificar_historico(self.lote.id)

        self.assertFalse(resultado["integro"])

    def test_lance_nos_dois_minutos_finais_estende_leilao(self):
        agora = timezone.now()
        encerramento_original = agora + timedelta(minutes=1)

        Lote.objects.filter(id=self.lote.id).update(
            encerramento=encerramento_original
        )

        with patch(
            "auctions.services_lances.timezone.now",
            return_value=agora,
        ):
            registrar_lance(
                lote_id=self.lote.id,
                participante=self.participante,
                valor=Decimal("51.00"),
            )

        self.lote.refresh_from_db()

        self.assertEqual(
            self.lote.encerramento,
            encerramento_original + timedelta(minutes=2),
        )

    def test_lance_fora_dos_dois_minutos_finais_nao_estende(self):
        agora = timezone.now()
        encerramento_original = agora + timedelta(minutes=5)

        Lote.objects.filter(id=self.lote.id).update(
            encerramento=encerramento_original
        )

        with patch(
            "auctions.services_lances.timezone.now",
            return_value=agora,
        ):
            registrar_lance(
                lote_id=self.lote.id,
                participante=self.participante,
                valor=Decimal("51.00"),
            )

        self.lote.refresh_from_db()

        self.assertEqual(
            self.lote.encerramento,
            encerramento_original,
        )


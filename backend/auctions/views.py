from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework import generics

from .models import Lote, Lance, Comprovante, Carteira
from .serializers import LoteSerializer, LanceSerializer, ComprovanteSerializer
from .services import buscar_livros
from .services_lances import registrar_lance, verificar_historico
from .services_encerramento import encerrar_leilao


@api_view(["GET"])
def health_check(request):
    return Response({
        "status": "online",
        "aplicacao": "Casa de Leiloes",
        "mensagem": "API funcionando!"
    })

class ListaLotesView(generics.ListAPIView):
    serializer_class = LoteSerializer
    queryset = Lote.objects.all().order_by("-criado_em")


@api_view(["GET"])
def buscar_livros_view(request):
    titulo = request.query_params.get("titulo", "").strip()

    if not titulo:
        return Response(
            {"erro": "Informe o título do livro."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        livros = buscar_livros(titulo)
        return Response(livros)

    except Exception:
        return Response(
            {"erro": "Não foi possível consultar a Open Library."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

class CriarLoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Somente leiloeiros podem criar lotes
        if request.user.tipo != "LEILOEIRO":
            return Response(
                {"erro": "Somente leiloeiros podem criar lotes."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = LoteSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(leiloeiro=request.user)
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class CriarLanceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lance = registrar_lance(
            lote_id=serializer.validated_data["lote"].id,
            participante=request.user,
            valor=serializer.validated_data["valor"],
        )

        return Response(
            LanceSerializer(lance).data,
            status=status.HTTP_201_CREATED,
        )


@api_view(["GET"])
def auditar_historico_view(request, lote_id):
    if not Lote.objects.filter(id=lote_id).exists():
        return Response(
            {"erro": "Lote não encontrado."},
            status=status.HTTP_404_NOT_FOUND,
        )

    resultado = verificar_historico(lote_id)

    codigo_status = (
        status.HTTP_200_OK
        if resultado["integro"]
        else status.HTTP_409_CONFLICT
    )

    return Response(resultado, status=codigo_status)


@api_view(["POST"])
def encerrar_leilao_view(request, lote_id):
    if not request.user.is_authenticated:
        return Response(
            {"erro": "Você precisa estar autenticado."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        lote = Lote.objects.get(id=lote_id)
    except Lote.DoesNotExist:
        return Response(
            {"erro": "Lote não encontrado."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.user.tipo != "LEILOEIRO" or lote.leiloeiro_id != request.user.id:
        return Response(
            {"erro": "Somente o leiloeiro responsável pode encerrar este lote."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        comprovante = encerrar_leilao(lote_id)
    except Exception as erro:
        from rest_framework.exceptions import ValidationError

        if isinstance(erro, ValidationError):
            return Response(
                {"erro": erro.detail},
                status=status.HTTP_400_BAD_REQUEST,
            )
        raise

    if comprovante is None:
        return Response(
            {
                "mensagem": "Leilão encerrado sem lances.",
                "lote_id": lote_id,
            },
            status=status.HTTP_200_OK,
        )

    return Response(
        {
            "mensagem": "Leilão encerrado com sucesso.",
            "lote_id": lote_id,
            "vencedor": comprovante.vencedor.username,
            "leiloeiro": comprovante.leiloeiro.username,
            "valor_pago": str(comprovante.valor_pago),
            "comprovante_id": comprovante.id,
        },
        status=status.HTTP_200_OK,
    )

class ListaComprovantesView(generics.ListAPIView):
    serializer_class = ComprovanteSerializer
    queryset = Comprovante.objects.select_related(
        "lote",
        "vencedor",
        "leiloeiro",
    ).order_by("-gerado_em")
    permission_classes = [IsAuthenticated]


class HistoricoLancesView(generics.ListAPIView):
    serializer_class = LanceSerializer

    def get_queryset(self):
        lote_id = self.kwargs["lote_id"]

        if not Lote.objects.filter(id=lote_id).exists():
            return Lance.objects.none()

        return (
            Lance.objects
            .filter(lote_id=lote_id)
            .select_related("participante", "lote")
            .order_by("criado_em", "id")
        )

class DepositarSaldoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from decimal import Decimal, InvalidOperation
        from django.db import transaction

        try:
            valor = Decimal(str(request.data.get("valor", "")))
        except InvalidOperation:
            return Response(
                {"erro": "Informe um valor válido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not valor.is_finite() or valor <= 0 or valor.as_tuple().exponent < -2:
            return Response(
                {"erro": "O depósito deve ser positivo e ter no máximo duas casas decimais."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            carteira, _ = Carteira.objects.get_or_create(
                usuario=request.user
            )
            carteira.saldo_disponivel += valor
            carteira.save(update_fields=["saldo_disponivel"])

        return Response({
            "mensagem": "Depósito realizado com sucesso.",
            "valor_depositado": str(valor),
            "saldo_disponivel": str(carteira.saldo_disponivel),
        }, status=status.HTTP_200_OK)
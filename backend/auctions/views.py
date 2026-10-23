from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework import generics

from .models import Lote, Lance
from .serializers import LoteSerializer, LanceSerializer
from .services import buscar_livros
from .services_lances import registrar_lance



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

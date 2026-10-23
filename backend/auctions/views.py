from rest_framework.decorators import api_view
from rest_framework.response import Response

from rest_framework import generics
from .models import Lote
from .serializers import LoteSerializer


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


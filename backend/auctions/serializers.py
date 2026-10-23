from rest_framework import serializers
from .models import Lote


class LoteSerializer(serializers.ModelSerializer):
    leiloeiro_nome = serializers.CharField(
        source="leiloeiro.username",
        read_only=True,
    )

    class Meta:
        model = Lote
        fields = [
            "id",
            "leiloeiro",
            "leiloeiro_nome",
            "nome",
            "descricao",
            "imagem_url",
            "api_item_id",
            "lance_inicial",
            "incremento_minimo",
            "inicio",
            "encerramento",
            "status",
        ]

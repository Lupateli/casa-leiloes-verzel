from rest_framework import serializers
from .models import Lote, Lance

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
        extra_kwargs = {
            "leiloeiro": {"required": False},
        }



class LanceSerializer(serializers.ModelSerializer):
    participante_nome = serializers.CharField(
        source="participante.username",
        read_only=True,
    )

    class Meta:
        model = Lance
        fields = [
            "id",
            "lote",
            "participante",
            "participante_nome",
            "valor",
            "criado_em",
        ]
        read_only_fields = [
            "participante",
            "criado_em",
        ]


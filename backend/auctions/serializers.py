from rest_framework import serializers
from .models import Lote, Lance, Comprovante

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



class ComprovanteSerializer(serializers.ModelSerializer):
    vencedor_nome = serializers.CharField(
        source="vencedor.username",
        read_only=True,
    )
    leiloeiro_nome = serializers.CharField(
        source="leiloeiro.username",
        read_only=True,
    )
    lote_nome = serializers.CharField(
        source="lote.nome",
        read_only=True,
    )

    class Meta:
        model = Comprovante
        fields = [
            "id",
            "lote",
            "lote_nome",
            "vencedor",
            "vencedor_nome",
            "leiloeiro",
            "leiloeiro_nome",
            "valor_pago",
            "gerado_em",
        ]
        read_only_fields = fields
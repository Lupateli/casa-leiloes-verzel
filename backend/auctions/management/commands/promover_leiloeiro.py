from django.core.management.base import BaseCommand, CommandError
from auctions.models import Usuario


class Command(BaseCommand):
    help = "Promove um usuário existente para o perfil de leiloeiro."

    def add_arguments(self, parser):
        parser.add_argument("username", type=str)

    def handle(self, *args, **options):
        username = options["username"]

        try:
            usuario = Usuario.objects.get(username=username)
        except Usuario.DoesNotExist:
            raise CommandError(
                f"Não existe usuário com o nome '{username}'."
            )

        usuario.tipo = Usuario.LEILOEIRO
        usuario.save(update_fields=["tipo"])

        self.stdout.write(
            self.style.SUCCESS(
                f"Usuário '{username}' promovido a LEILOEIRO com sucesso."
            )
        )

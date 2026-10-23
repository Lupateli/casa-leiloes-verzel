import requests


def buscar_livros(termo):
    url = "https://openlibrary.org/search.json"

    resposta = requests.get(
        url,
        params={"title": termo, "limit": 10},
        timeout=10,
    )

    resposta.raise_for_status()
    dados = resposta.json()

    livros = []

    for livro in dados.get("docs", []):
        livros.append({
            "titulo": livro.get("title", "Sem título"),
            "autor": ", ".join(livro.get("author_name", [])),
            "ano": livro.get("first_publish_year"),
            "open_library_id": livro.get("key"),
            "imagem_url": (
                f"https://covers.openlibrary.org/b/id/"
                f"{livro['cover_i']}-M.jpg"
                if livro.get("cover_i")
                else ""
            ),
        })

    return livros

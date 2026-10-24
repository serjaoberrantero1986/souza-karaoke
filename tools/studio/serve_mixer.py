"""Serve somente a pasta do projeto escolhido, apenas neste computador."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Abrir o mixer local do Studio.")
    parser.add_argument("job", type=Path)
    parser.add_argument("--port", type=int, default=17845)
    args = parser.parse_args()
    root = args.job.resolve(strict=True)
    if not (root / "mixer.json").is_file():
        parser.error("Prepare o mixer deste projeto antes de abrir o servidor.")
    SimpleHTTPRequestHandler.extensions_map[".mjs"] = "text/javascript"
    server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(SimpleHTTPRequestHandler, directory=str(root)))
    print(f"Studio: http://127.0.0.1:{server.server_port}/mixer.html", flush=True)
    print("Mantenha este processo aberto durante a utilização. Ctrl+C encerra.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

"""Obtém os catálogos oficiais pela API GitHub quando o domínio raw não responde."""
import base64
import json
import urllib.request
from pathlib import Path

DESTINATION = Path(__file__).resolve().parents[2] / ".studio-data" / "models"
FILES = {
    "download_checks.json": "filelists/download_checks.json",
    "vr_model_data.json": "vr_model_data/model_data_new.json",
    "mdx_model_data.json": "mdx_model_data/model_data_new.json",
}


def main():
    DESTINATION.mkdir(parents=True, exist_ok=True)
    for name, remote in FILES.items():
        destination = DESTINATION / name
        if destination.exists():
            json.loads(destination.read_text(encoding="utf-8"))
            continue
        request = urllib.request.Request(
            f"https://api.github.com/repos/TRvlvr/application_data/contents/{remote}?ref=main",
            headers={"User-Agent": "Karaoke-Studio", "Accept": "application/vnd.github+json"})
        with urllib.request.urlopen(request, timeout=30) as response:
            envelope = json.load(response)
        content = base64.b64decode(envelope["content"])
        json.loads(content)
        temporary = destination.with_suffix(".tmp")
        temporary.write_bytes(content)
        temporary.replace(destination)
        print(f"Catálogo preparado: {name}", flush=True)


if __name__ == "__main__":
    main()

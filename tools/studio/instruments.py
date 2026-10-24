"""Separação em quatro faixas, preservando o ganho relativo entre instrumentos."""
import hashlib
import urllib.request
from pathlib import Path

import separate as worker

MODEL = "955717e8-8726e21a.th"
MODEL_URL = "https://dl.fbaipublicfiles.com/demucs/hybrid_transformer/" + MODEL


def prepare_model():
    destination = worker.DATA / "models" / MODEL
    destination.parent.mkdir(parents=True, exist_ok=True)
    if not destination.exists():
        temporary = destination.with_suffix(".part")
        print("Baixando modelo de instrumentos...", flush=True)
        with urllib.request.urlopen(MODEL_URL, timeout=60) as response, temporary.open("wb") as output:
            while chunk := response.read(1024 * 1024):
                output.write(chunk)
        temporary.replace(destination)
    with destination.open("rb") as stream:
        digest = hashlib.file_digest(stream, "sha256").hexdigest()
    if not digest.startswith("8726e21a"):
        raise ValueError("O modelo de instrumentos não passou na verificação de integridade.")
    return destination, digest


def separate_instruments(source: Path, destination: Path):
    import numpy as np
    import soundfile as sf
    import torch
    from audio_separator.separator.uvr_lib_v5.demucs.apply import apply_model
    from audio_separator.separator.uvr_lib_v5.demucs.states import load_model

    model_path, digest = prepare_model()
    # Os pesos oficiais referenciam módulos 'demucs'; o adaptador UVR usa este mesmo caminho.
    import sys
    import audio_separator
    sys.path.insert(0, str(Path(audio_separator.__file__).parent / "separator" / "uvr_lib_v5"))
    model = load_model(model_path).cpu().eval()
    samples, rate = sf.read(source, dtype="float32", always_2d=True)
    if rate != model.samplerate or samples.shape[1] != model.audio_channels:
        raise ValueError("Áudio incompatível com o modelo de instrumentos.")
    torch.manual_seed(0)
    mix = torch.from_numpy(samples.T.copy())
    reference = mix.mean(0)
    mean, deviation = reference.mean(), reference.std().clamp_min(1e-8)
    print("Separando voz, bateria, baixo e outros instrumentos...", flush=True)
    with torch.inference_mode():
        stems = apply_model(model, ((mix - mean) / deviation)[None], shifts=0,
                            split=True, overlap=0.25, device="cpu", progress=True)[0]
        stems = (stems * deviation + mean).cpu().numpy()
    expected = {"vocals": "voz", "drums": "bateria", "bass": "baixo", "other": "outros"}
    if set(model.sources) != set(expected):
        raise ValueError("O modelo retornou uma organização inesperada de instrumentos.")
    destination.mkdir()
    paths = {}
    for name, audio in zip(model.sources, stems):
        if audio.shape != samples.T.shape or not np.isfinite(audio).all():
            raise ValueError(f"Faixa inválida: {name}")
        path = destination / f"{expected[name]}.wav"
        # Float preserva os ganhos entre faixas, inclusive picos acima de 0 dBFS.
        sf.write(path, audio.T, rate, subtype="FLOAT")
        paths[name] = path
    return paths, digest


if __name__ == "__main__":
    prepare_model()

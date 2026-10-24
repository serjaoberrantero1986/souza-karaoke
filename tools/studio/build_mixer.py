"""Prepara a escuta sincronizada de um projeto de quatro instrumentos."""
import argparse
import json
import shutil
from pathlib import Path

LABELS = {"vocals": "Voz", "drums": "Bateria", "bass": "Baixo", "other": "Outros instrumentos"}
ASSETS = ("mixer.html", "mixer.css", "mixer-ui.mjs", "mixer-engine.mjs")


def build(job, references=None):
    import soundfile as sf
    import numpy as np
    job = job.resolve(strict=True)
    manifest = json.loads((job / "manifest.json").read_text(encoding="utf-8"))
    if manifest["status"] != "completed" or set(manifest.get("instrumentStems", {})) != set(LABELS):
        raise ValueError("Escolha um projeto concluído com os quatro instrumentos.")
    groups = [{"label": "Studio", "tracks": [
        {"label": LABELS[key], "url": manifest["instrumentStems"][key]} for key in LABELS]}]
    original = sf.info(job / "original.wav")
    if references:
        # Exige as quatro referências antes de preparar a comparação.
        source_name = Path(manifest["source"]).stem
        files = {key: references / f"{source_name}_{key}_mixed.mp3" for key in LABELS}
        if not all(path.is_file() for path in files.values()):
            raise ValueError("Não foram encontradas as quatro faixas de referência desta música.")
        reference_folder = job / "referencia-moises"
        reference_folder.mkdir(exist_ok=True)
        tracks = []
        for key, path in files.items():
            with sf.SoundFile(path) as stream:
                if stream.samplerate != original.samplerate or stream.channels != original.channels:
                    raise ValueError("A referência deve ter a mesma taxa de amostragem e canais do projeto.")
                stream.seek(round(manifest["selection"]["startSeconds"] * stream.samplerate))
                audio = stream.read(original.frames, dtype="float32", always_2d=True)
            if len(audio) != original.frames:
                raise ValueError("A referência não cobre todo o trecho escolhido.")
            target = reference_folder / f"{key}.wav"
            sf.write(target, audio, original.samplerate, subtype="FLOAT")
            tracks.append({"label": LABELS[key], "url": target.relative_to(job).as_posix()})
        groups.append({"label": "Moises · referência", "tracks": tracks})
    groups.append({"label": "Música original", "tracks": [{"label": "Original", "url": "original.wav"}]})
    # Uma atenuação comum evita clipping em qualquer combinação de volumes/solo.
    # Não normaliza instrumentos individualmente nem muda os níveis entre conjuntos.
    bound = 1.0
    for group in groups:
        summed_absolute = None
        for track in group["tracks"]:
            audio, _ = sf.read(job / track["url"], dtype="float32", always_2d=True)
            if len(audio) != original.frames:
                raise ValueError("Todas as faixas devem cobrir exatamente o mesmo trecho.")
            summed_absolute = np.abs(audio) if summed_absolute is None else summed_absolute + np.abs(audio)
        if not np.isfinite(summed_absolute).all():
            raise ValueError("Há valores inválidos nas faixas do projeto.")
        bound = max(bound, float(np.max(summed_absolute)))
    config = {"title": Path(manifest["source"]).stem, "startSeconds": manifest["selection"]["startSeconds"],
              "outputGain": 0.98 / bound, "groups": groups}
    for asset in ASSETS:
        shutil.copyfile(Path(__file__).parent / asset, job / asset)
    (job / "mixer.json").write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")
    return job / "mixer.html"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Preparar o mixer de um projeto do Studio.")
    parser.add_argument("job", type=Path)
    parser.add_argument("--references", type=Path, help="Pasta com as quatro faixas exportadas pelo Moises.")
    args = parser.parse_args()
    print(build(args.job, args.references))

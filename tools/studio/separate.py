"""Prova de separação do Studio. Nunca modifica o áudio de entrada."""
import argparse
import hashlib
import html
import importlib.metadata
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / ".studio-data"


def run(command):
    environment = os.environ.copy()
    environment["PATH"] = str(DATA / "bin") + os.pathsep + environment.get("PATH", "")
    subprocess.run(command, check=True, env=environment)


def prepare_ffmpeg():
    import imageio_ffmpeg
    binary = DATA / "bin" / ("ffmpeg.exe" if os.name == "nt" else "ffmpeg")
    binary.parent.mkdir(parents=True, exist_ok=True)
    if not binary.exists():
        shutil.copy2(imageio_ffmpeg.get_ffmpeg_exe(), binary)
    return str(binary)


def validate_audio(path, reference=None):
    import soundfile as sf
    info = sf.info(path)
    if info.frames <= 0 or info.samplerate != 44100 or info.channels != 2:
        raise ValueError(f"Formato de áudio inesperado: {path.name}")
    if reference and abs(info.frames - reference.frames) > 441:
        raise ValueError(f"Duração divergente: {path.name}. Revisão necessária.")
    return info


def separate(source, destination, model, names):
    destination.mkdir()
    run([sys.executable, "-c", "from audio_separator.utils.cli import main; main()", str(source),
         "--model_filename", model, "--output_dir", str(destination),
         "--model_file_dir", str(DATA / "models"), "--output_format", "WAV",
         "--sample_rate", "44100", "--use_soundfile",
         "--custom_output_names", json.dumps(names)])
    outputs = {key: destination / f"{name}.wav" for key, name in names.items()}
    for path in outputs.values():
        if not path.is_file():
            raise RuntimeError(f"O modelo não produziu a faixa esperada: {path.name}")
    return outputs


def process(source, vocal_model, choir_model, start=0, duration=None, instruments=False):
    source = source.resolve(strict=True)
    if source.suffix.lower() not in {".mp3", ".wav", ".flac"}:
        raise ValueError("Escolha um arquivo MP3, WAV ou FLAC.")
    if start < 0 or (duration is not None and duration <= 0):
        raise ValueError("O início deve ser positivo ou zero, e a duração maior que zero.")
    job = DATA / "jobs" / uuid4().hex
    job.mkdir(parents=True)
    manifest = {"schemaVersion": 1, "status": "processing", "source": str(source),
                "models": {"vocals": vocal_model, "choir": choir_model} if not instruments else {"instruments": "htdemucs"},
                "quality": "pending_listening_review", "stems": {},
                "selection": {"startSeconds": start, "durationSeconds": duration}}
    started = time.monotonic()

    def save():
        temporary = job / "manifest.tmp"
        temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
        temporary.replace(job / "manifest.json")

    save()
    print(f"Projeto: {job}", flush=True)
    try:
        manifest["engineVersion"] = importlib.metadata.version("audio-separator")
        with source.open("rb") as stream:
            manifest["sourceSha256"] = hashlib.file_digest(stream, "sha256").hexdigest()
        original = job / "original.wav"
        selection = ["-ss", str(start)] + (["-t", str(duration)] if duration is not None else [])
        run([prepare_ffmpeg(), "-nostdin", "-v", "error", "-i", str(source), *selection,
             "-ar", "44100", "-ac", "2", "-c:a", "pcm_s24le", str(original)])
        reference = validate_audio(original)
        manifest["modelSha256"] = {}
        if instruments:
            from instruments import separate_instruments, MODEL
            stems, digest = separate_instruments(original, job / "instrumentos")
            manifest["modelSha256"][MODEL] = digest
            labels = {"vocals": "Voz", "drums": "Bateria", "bass": "Baixo", "other": "Outros instrumentos"}
            tracks = {"Original": original, **{labels[key]: stems[key] for key in labels}}
            for path in stems.values():
                validate_audio(path, reference)
            manifest["instrumentStems"] = {key: path.relative_to(job).as_posix() for key, path in stems.items()}
        else:
            print("Separando instrumental e vozes...", flush=True)
            first = separate(original, job / "vozes", vocal_model,
                             {"Vocals": "vozes", "Instrumental": "instrumental"})
            for path in first.values():
                validate_audio(path, reference)
            print("Separando voz principal e coral...", flush=True)
            second = separate(first["Vocals"], job / "coral", choir_model,
                              {"Vocals": "voz-principal", "Instrumental": "coral"})
            for path in second.values():
                validate_audio(path, reference)
            for model in (vocal_model, choir_model):
                model_path = DATA / "models" / model
                if model_path.is_file():
                    with model_path.open("rb") as stream:
                        manifest["modelSha256"][model] = hashlib.file_digest(stream, "sha256").hexdigest()
            tracks = {"Original": original, "Instrumental": first["Instrumental"],
                      "Voz principal e coral": first["Vocals"],
                      "Voz principal (candidata)": second["Vocals"],
                      "Coral (candidato)": second["Instrumental"]}
        manifest["stems"] = {label: path.relative_to(job).as_posix() for label, path in tracks.items()}
        manifest.update(status="completed", durationSeconds=reference.duration,
                        elapsedSeconds=round(time.monotonic() - started, 2))
        cards = "".join(f'<section><h2>{html.escape(label)}</h2><audio controls preload="metadata" src="{path.relative_to(job).as_posix()}"></audio></section>'
                        for label, path in tracks.items())
        (job / "comparar.html").write_text(
            '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>Studio — comparação de faixas</title><style>body{background:#14141b;color:#eee;font:18px system-ui;max-width:800px;margin:24px auto;padding:16px}section{background:#252530;padding:16px;margin:16px 0;border-radius:16px}audio{width:100%}</style>'
            '<h1>Comparação de faixas</h1><p>' + html.escape(source.name) + '</p>'
            '<p>A separação precisa de revisão auditiva. Confira vazamento de voz, preservação do coral, artefatos e sincronização. Ouça uma faixa por vez.</p>' + cards + '</html>', encoding="utf-8")
        print(f"Abra para comparar: {job / 'comparar.html'}", flush=True)
    except (Exception, KeyboardInterrupt) as error:
        manifest.update(status="cancelled" if isinstance(error, KeyboardInterrupt) else "failed",
                        error=str(error), elapsedSeconds=round(time.monotonic() - started, 2))
        raise
    finally:
        save()
    return job


def main():
    parser = argparse.ArgumentParser(description="Separar uma música para revisão no Studio.")
    parser.add_argument("audio", type=Path)
    parser.add_argument("--vocal-model", default="UVR-MDX-NET-Inst_HQ_3.onnx")
    parser.add_argument("--choir-model", default="UVR_MDXNET_KARA_2.onnx")
    parser.add_argument("--start", type=float, default=0, help="Início do trecho, em segundos.")
    parser.add_argument("--duration", type=float, help="Duração do trecho; omitido processa até o final.")
    parser.add_argument("--instruments", action="store_true", help="Separar voz, bateria, baixo e outros instrumentos.")
    parser.add_argument("--references", type=Path, help="Pasta das quatro faixas do Moises para comparação no mixer.")
    args = parser.parse_args()
    if args.references and not args.instruments:
        parser.error("Use --references junto com --instruments.")
    job = process(args.audio, args.vocal_model, args.choir_model, args.start, args.duration, args.instruments)
    if args.instruments:
        from build_mixer import build
        print(f"Mixer preparado: {build(job, args.references)}", flush=True)


if __name__ == "__main__":
    main()

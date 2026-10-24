"""DoRéMiFode AI Studio: proof-of-concept CLI. No player imports."""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

STEM_EXTENSIONS = {".wav", ".flac", ".mp3", ".m4a"}
LEAD_TERMS = ("lead", "main vocal", "main_vocal")
BACK_TERMS = ("backing", "background", "bv ", "bv_", "harmon")
VOCAL_TERMS = ("vocal",)
INSTRUMENTAL_TERMS = ("instrumental", "no vocals", "no_vocals", "karaoke")


def execute(args: list[str]) -> None:
    print("+", " ".join(str(x) for x in args), flush=True)
    subprocess.run(args, check=True)


def require_input(value: str) -> Path:
    path = Path(value).expanduser().resolve()
    if not path.is_file():
        raise ValueError(f"Arquivo inexistente: {path}")
    return path


def outputs(folder: Path) -> list[Path]:
    return [x for x in folder.iterdir() if x.is_file() and x.suffix.lower() in STEM_EXTENSIONS]


def classify(files: list[Path], words: tuple[str, ...], *, exclude: tuple[str, ...] = ()) -> Path:
    matches = [p for p in files if any(w in p.stem.lower() for w in words)
               and not any(w in p.stem.lower() for w in exclude)]
    if len(matches) != 1:
        raise ValueError(f"Esperada uma faixa correspondente a {words}; encontrados: {[p.name for p in matches]}. "
                         "Confira as saídas do modelo antes de continuar.")
    return matches[0]


def separator(audio: Path, folder: Path, model: str, directml: bool) -> list[Path]:
    if not shutil.which("audio-separator"):
        raise RuntimeError("Instale audio-separator no ambiente Python antes de executar.")
    folder.mkdir(parents=True, exist_ok=True)
    cmd = ["audio-separator", str(audio), "--model_filename", model,
           "--output_format", "WAV", "--output_dir", str(folder)]
    if directml:
        cmd.append("--use_directml")
    execute(cmd)
    return outputs(folder)


def separate(args: argparse.Namespace) -> None:
    source = require_input(args.audio)
    root = Path(args.output).expanduser().resolve()
    if root.exists() and any(root.iterdir()):
        raise ValueError("Pasta de destino não vazia. Use uma pasta nova para evitar confusão entre faixas.")
    stage1 = root / "stage1"
    primary = separator(source, stage1, args.vocal_model, args.directml)
    instrumental = classify(primary, INSTRUMENTAL_TERMS)
    vocals = classify(primary, VOCAL_TERMS, exclude=INSTRUMENTAL_TERMS)
    manifest: dict = {
        "schema": "doremifode.ai-studio.poc.v1",
        "status": "two_stems",
        "source": str(source),
        "settings": {"vocal_model": args.vocal_model, "directml": args.directml},
        "stems": {"instrumental": str(instrumental), "all_vocals": str(vocals)},
        "warnings": ["Saídas não verificadas por escuta; classificação baseada nos nomes dos arquivos."]
    }
    if args.lead_backing_model:
        stage2 = separator(vocals, root / "stage2", args.lead_backing_model, args.directml)
        # Strictly do not guess that an arbitrary second stem is backing vocals.
        lead = classify(stage2, LEAD_TERMS)
        backing = classify(stage2, BACK_TERMS)
        if lead == backing:
            raise ValueError("Classificação inválida: vocal principal e backing apontam ao mesmo arquivo.")
        manifest["status"] = "three_stems_unverified"
        manifest["settings"]["lead_backing_model"] = args.lead_backing_model
        manifest["stems"].update(lead=str(lead), backing=str(backing))
        manifest["warnings"].append("Lead/backing identificados por nomes, não por análise acústica.")
    root.mkdir(parents=True, exist_ok=True)
    (root / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Manifesto: {root / 'manifest.json'}")


def align(args: argparse.Namespace) -> None:
    """Word timestamps only; not syllable-accurate alignment."""
    source = require_input(args.audio)
    lyrics = require_input(args.lyrics).read_text(encoding="utf-8").strip()
    if not lyrics:
        raise ValueError("Letra vazia.")
    if not shutil.which("ffmpeg"):
        raise RuntimeError("FFmpeg não encontrado no PATH.")
    out = Path(args.output).expanduser().resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    wav = out.with_suffix(".aligned-input.wav")
    if wav.exists():
        raise ValueError(f"Arquivo temporário já existe: {wav}")
    execute(["ffmpeg", "-nostdin", "-v", "error", "-i", str(source),
             "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", str(wav)])
    try:
        import torch
        from qwen_asr import Qwen3ForcedAligner
        model = Qwen3ForcedAligner.from_pretrained(
            args.model, dtype=torch.float32, device_map="cpu"
        )
        results = model.align(audio=str(wav), text=lyrics, language="Portuguese")
        if not results or not results[0]:
            raise RuntimeError("Modelo não retornou alinhamentos.")
        segments = [{"text": str(w.text), "start": float(w.start_time), "end": float(w.end_time)}
                    for w in results[0]]
        for item in segments:
            if item["start"] < 0 or item["end"] < item["start"]:
                raise RuntimeError("Modelo retornou tempos inválidos.")
        doc = {"schema": "doremifode.ai-studio.word-alignment.v1",
               "source": str(source), "language": "pt",
               "granularity": "word", "model": args.model,
               "words": segments, "review_required": True,
               "warning": "Tempos de palavras estimados por IA. Não representam fronteiras de sílabas."}
        if out.exists():
            raise ValueError(f"Saída já existe: {out}")
        out.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Alinhamento por PALAVRAS: {out}")
    finally:
        wav.unlink(missing_ok=True)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="DoRéMiFode AI Studio: POC isolada, sem integração ao player")
    cmd = parser.add_subparsers(dest="command", required=True)
    sep = cmd.add_parser("separate", help="Criar stems, sem sobrescrever resultados anteriores")
    sep.add_argument("--audio", required=True)
    sep.add_argument("--output", required=True)
    sep.add_argument("--vocal-model", default="UVR_MDXNET_KARA_2.onnx")
    sep.add_argument("--lead-backing-model", help="Modelo especializado com saídas nomeadas lead e backing")
    sep.add_argument("--directml", action="store_true", help="GPU AMD/Intel no Windows: experimental")
    al = cmd.add_parser("align-words", help="Alinhamento por palavras, NÃO por sílabas")
    al.add_argument("--audio", required=True, help="Preferencialmente faixa all_vocals")
    al.add_argument("--lyrics", required=True, help="Letra fornecida e autorizada")
    al.add_argument("--output", required=True)
    al.add_argument("--model", default="Qwen/Qwen3-ForcedAligner-0.6B")
    args = parser.parse_args(argv)
    try:
        (separate if args.command == "separate" else align)(args)
    except (ValueError, RuntimeError, subprocess.CalledProcessError, ImportError, OSError) as exc:
        print(f"ERRO: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

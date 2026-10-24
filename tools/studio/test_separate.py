import tempfile
import json
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import separate


class SeparationTests(unittest.TestCase):
    def test_missing_model_output_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(separate, "run"):
            with self.assertRaisesRegex(RuntimeError, "faixa esperada"):
                separate.separate(Path("input.wav"), Path(directory) / "out", "model.onnx", {"Vocals": "vozes"})

    def test_model_outputs_use_explicit_names_and_argument_list(self):
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory) / "saída com espaço"
            def fake_run(command):
                self.assertIn(str(destination), command)
                (destination / "vozes.wav").write_bytes(b"audio")
            with patch.object(separate, "run", side_effect=fake_run):
                outputs = separate.separate(Path("input.wav"), destination, "model.onnx", {"Vocals": "vozes"})
                self.assertEqual(outputs["Vocals"], destination / "vozes.wav")

    def test_duration_mismatch_is_rejected(self):
        info = SimpleNamespace(frames=88200, samplerate=44100, channels=2)
        with patch.dict("sys.modules", {"soundfile": SimpleNamespace(info=lambda _: info)}):
            with self.assertRaisesRegex(ValueError, "Duração divergente"):
                separate.validate_audio(Path("voice.wav"), SimpleNamespace(frames=44100))

    def test_failure_records_diagnostic_and_preserves_source(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "música.mp3"
            source.write_bytes(b"original")
            with patch.object(separate, "prepare_ffmpeg", return_value="ffmpeg"), patch.object(separate.importlib.metadata, "version", return_value="test"), patch.object(separate, "DATA", root / "data"), patch.object(separate, "run", side_effect=RuntimeError("falha de conversão")):
                with self.assertRaisesRegex(RuntimeError, "falha de conversão"):
                    separate.process(source, "vocals.onnx", "choir.onnx")
            manifest = json.loads(next((root / "data").rglob("manifest.json")).read_text(encoding="utf-8"))
            self.assertEqual(manifest["status"], "failed")
            self.assertEqual(source.read_bytes(), b"original")
            self.assertEqual(manifest["stems"], {})


if __name__ == "__main__":
    unittest.main()

import argparse
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import studio_poc as poc


class PocTests(unittest.TestCase):
    def test_classification_requires_unambiguous_name(self):
        files = [Path("song_(Vocals).wav"), Path("song_(Instrumental).wav")]
        self.assertEqual(poc.classify(files, poc.VOCAL_TERMS, exclude=poc.INSTRUMENTAL_TERMS), files[0])
        self.assertEqual(poc.classify(files, poc.INSTRUMENTAL_TERMS), files[1])
        with self.assertRaises(ValueError):
            poc.classify(files, poc.BACK_TERMS)

    def test_missing_input(self):
        with self.assertRaises(ValueError):
            poc.require_input("definitely-does-not-exist.wav")

    def test_refuses_nonempty_output(self):
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp)
            source = base / "audio.wav"
            source.write_bytes(b"fake audio; model mocked")
            out = base / "output"
            out.mkdir()
            (out / "existing.txt").write_text("keep", encoding="utf-8")
            with self.assertRaises(ValueError):
                poc.separate(argparse.Namespace(audio=str(source), output=str(out), vocal_model="test.onnx", lead_backing_model=None, directml=False))
            self.assertTrue((out / "existing.txt").exists())

    def test_two_stem_manifest_no_fake_backing(self):
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp)
            audio = base / "test.wav"
            audio.write_bytes(b"fake")
            output = base / "out"
            def fake_separator(audio_path, folder, model, directml):
                folder.mkdir(parents=True, exist_ok=True)
                return [folder / "test_(Vocals).wav", folder / "test_(Instrumental).wav"]
            with patch.object(poc, "separator", fake_separator):
                poc.separate(argparse.Namespace(audio=str(audio), output=str(output), vocal_model="mock", lead_backing_model=None, directml=False))
            import json
            manifest = json.loads((output / "manifest.json").read_text(encoding="utf-8"))
            self.assertEqual(manifest["status"], "two_stems")
            self.assertNotIn("backing", manifest["stems"])


if __name__ == "__main__":
    unittest.main()

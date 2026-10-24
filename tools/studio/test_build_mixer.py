import json
import tempfile
import unittest
from pathlib import Path

import numpy as np
import soundfile as sf
from build_mixer import build, LABELS


class MixerBuildTests(unittest.TestCase):
    def make_job(self, root):
        audio = np.full((441, 2), 2, dtype="float32")
        sf.write(root / "original.wav", audio, 44100, subtype="FLOAT")
        stems = {}
        for key in LABELS:
            sf.write(root / f"{key}.wav", audio, 44100, subtype="FLOAT")
            stems[key] = f"{key}.wav"
        manifest = {"status": "completed", "source": "Música.mp3", "instrumentStems": stems,
                    "selection": {"startSeconds": 0}}
        (root / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")

    def test_common_headroom_preserves_levels_without_clipping(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.make_job(root)
            build(root)
            config = json.loads((root / "mixer.json").read_text(encoding="utf-8"))
            self.assertAlmostEqual(config["outputGain"] * 8, 0.98)
            self.assertEqual(len(config["groups"][0]["tracks"]), 4)
            self.assertTrue((root / "mixer-engine.mjs").is_file())

    def test_incomplete_project_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "manifest.json").write_text('{"status":"failed"}', encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "concluído"):
                build(root)

    def test_missing_reference_does_not_silently_omit_tracks(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.make_job(root)
            with self.assertRaisesRegex(ValueError, "quatro faixas"):
                build(root, root)

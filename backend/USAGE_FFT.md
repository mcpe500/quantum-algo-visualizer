Generate FFT visualization images

Usage:

- From the `backend` folder run (Python environment with `numpy` and `matplotlib`):

```
python generate_fft_images.py                       # runs example alternating signal
python generate_fft_images.py path/to/case.json     # generate visualizations for JSON case
```

Behavior:
- The script will look for common keys in the JSON (`signal`, `signal_data`, `time_series`, `samples`).
- If an adjacency matrix is present under `graph.adjacency_matrix`, a degree-sequence signal will be derived.
- Images are saved under `D:\Ivan\TA\document5\bab4\bab4.4\Gambar\generated_fft/<case_id>/`.

Notes:
- The script produces a concise set of images showing: input signal, even/odd split, FFT of sub-signals, and the butterfly/combine result.
- This is intentionally readable and theme-aware (uses project-like blue/green/red palette). If you want different colors or deeper step animations, I can extend it to produce SVG or animated frames.

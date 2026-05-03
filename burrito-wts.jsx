import React, { useState, useRef } from "react";
import { Upload, Camera, Loader2, AlertCircle, CheckCircle2, XCircle, Sparkles } from "lucide-react";

export default function BurritoWTS() {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setImage(dataUrl);
      // Strip the data URL prefix to get raw base64
      const base64 = dataUrl.split(",")[1];
      setImageBase64(base64);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzeBurrito = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const mediaType = image.match(/data:(image\/\w+)/)?.[1] || "image/jpeg";

    const systemPrompt = `You are a Wrap Tension Score (WTS) analyzer for burritos. Evaluate structural integrity with the rigor of a taqueria veteran.

CRITICAL: Your entire response must be a single valid JSON object. No markdown fences. No preamble. No explanation outside the JSON. Start your response with { and end with }.

Step 1 — Burrito gate. Determine if the image contains a burrito. Wraps, quesadillas, taquitos, and chimichangas are NOT burritos. A burrito is cylindrical with a flour tortilla folded around fillings on both ends.

Step 2 — If it IS a burrito, score 0-100 on each axis:
- surface_tautness: drum-tight tortilla = high. Wrinkles, slack, pooling = low.
- end_cap_integrity: ends flush, tucked, sealed = high. Flapping/visible filling = low.
- diameter_consistency: clean cylinder = high. Lumpy sausage = low.
- structural_balance: sustainable filling ratio = high. Overstuffed or understuffed = low.

Step 3 — overall_wts = surface_tautness*0.3 + end_cap_integrity*0.3 + diameter_consistency*0.2 + structural_balance*0.2

Step 4 — Provide a punchy one-line diagnosis (e.g., "premature seam separation imminent" or "structurally sound, will survive transport").

Step 5 — Estimate minutes_until_failure (well-wrapped: 20+, doomed: <5).

Output this exact JSON shape and nothing else:
{"is_burrito": true, "detected_object": "burrito", "confidence": 95, "scores": {"surface_tautness": 75, "end_cap_integrity": 80, "diameter_consistency": 70, "structural_balance": 85}, "overall_wts": 77, "diagnosis": "string here", "minutes_until_failure": 15}

If not a burrito, use this shape:
{"is_burrito": false, "detected_object": "what you see", "confidence": 95, "scores": null, "overall_wts": null, "diagnosis": "string here", "minutes_until_failure": null}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: imageBase64,
                  },
                },
                {
                  type: "text",
                  text: systemPrompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API error: ${response.status} ${errText}`);
      }

      const data = await response.json();
      const textBlock = data.content.find((b) => b.type === "text");
      if (!textBlock) throw new Error("No text response from API");

      const rawText = textBlock.text.trim();

      // Robust JSON extraction: find the first { and last } and try to parse
      // that substring. Handles markdown fences, preamble, and trailing text.
      const firstBrace = rawText.indexOf("{");
      const lastBrace = rawText.lastIndexOf("}");

      if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
        throw new Error(`No JSON object found in response. Got: ${rawText.slice(0, 200)}`);
      }

      const jsonCandidate = rawText.slice(firstBrace, lastBrace + 1);

      let parsed;
      try {
        parsed = JSON.parse(jsonCandidate);
      } catch (parseErr) {
        throw new Error(`JSON parse failed: ${parseErr.message}. Raw: ${rawText.slice(0, 300)}`);
      }

      // Validate shape
      if (typeof parsed.is_burrito !== "boolean") {
        throw new Error(`Invalid response shape — missing is_burrito. Raw: ${rawText.slice(0, 200)}`);
      }

      setResult(parsed);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong analyzing your burrito.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setImageBase64(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-black text-stone-900 mb-2 tracking-tight">
            Wrap Tension Score
          </h1>
          <p className="text-stone-600 text-lg">
            Burrito structural integrity, quantified.
          </p>
        </div>

        {/* Upload area */}
        {!image && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 rounded-2xl p-12 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all bg-white shadow-sm"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                <Upload className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-stone-800 text-lg">
                  Upload a burrito photo
                </p>
                <p className="text-stone-500 text-sm mt-1">
                  Click to select an image from your device
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Image preview */}
        {image && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
            <div className="relative">
              <img
                src={image}
                alt="Burrito candidate"
                className="w-full h-64 sm:h-80 object-cover"
              />
              {loading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3" />
                    <p className="font-medium">Analyzing structural integrity...</p>
                    <p className="text-sm text-white/70 mt-1">Measuring wrap tension across all axes</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 flex gap-2">
              {!result && !loading && (
                <button
                  onClick={analyzeBurrito}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Analyze
                </button>
              )}
              <button
                onClick={reset}
                className="px-4 py-3 border border-stone-300 hover:bg-stone-50 rounded-xl font-medium text-stone-700 transition-colors"
              >
                {result ? "Try Another" : "Cancel"}
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Analysis failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Burrito gate */}
            <div className={`p-5 border-b ${result.is_burrito ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
              <div className="flex items-center gap-3">
                {result.is_burrito ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-stone-900">
                    {result.is_burrito ? "Burrito confirmed" : `Not a burrito — detected: ${result.detected_object}`}
                  </p>
                  <p className="text-sm text-stone-600">
                    Confidence: {result.confidence}%
                  </p>
                </div>
              </div>
            </div>

            {/* WTS Score */}
            {result.is_burrito && result.overall_wts !== null && (
              <>
                <div className="p-6 text-center border-b border-stone-100">
                  <p className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-2">
                    Wrap Tension Score
                  </p>
                  <div className={`text-7xl font-black ${getScoreColor(result.overall_wts)}`}>
                    {Math.round(result.overall_wts)}
                  </div>
                  <p className="text-stone-700 italic mt-3 text-base">
                    "{result.diagnosis}"
                  </p>
                  {result.minutes_until_failure !== null && (
                    <p className="text-sm text-stone-500 mt-2">
                      Estimated time until structural failure: <span className="font-semibold text-stone-700">{result.minutes_until_failure} min</span>
                    </p>
                  )}
                </div>

                {/* Sub-scores */}
                <div className="p-6 space-y-4">
                  <p className="text-sm font-semibold text-stone-700 uppercase tracking-wider">
                    Diagnostic Breakdown
                  </p>
                  {Object.entries(result.scores).map(([key, score]) => (
                    <div key={key}>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-sm font-medium text-stone-700 capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className={`font-bold ${getScoreColor(score)}`}>
                          {Math.round(score)}
                        </span>
                      </div>
                      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getScoreBg(score)} transition-all duration-700`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Not a burrito */}
            {!result.is_burrito && (
              <div className="p-6 text-center">
                <p className="text-stone-700 italic">"{result.diagnosis}"</p>
                <p className="text-sm text-stone-500 mt-3">
                  Try uploading an actual burrito.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-stone-400 mt-6">
          Powered by Claude Haiku 4.5 vision · ~$0.003 per scan
        </p>
      </div>
    </div>
  );
}

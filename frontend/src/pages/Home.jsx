import { useState, useRef } from 'react'
import { Upload, Sparkles, AlertCircle, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import ScoreCard from '../components/ScoreCard'
import PostScanCTA from '../components/PostScanCTA'

export default function Home() {
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  function handleFileSelect(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    setFile(f)
    setResult(null)
    setError(null)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(f)
  }

  async function analyze() {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await api.scoreBurrito(file)
      setResult(data)
    } catch (err) {
      setError(err.message || 'Something went wrong analyzing your burrito.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setPreview(null)
    setFile(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-black text-stone-900 mb-2 tracking-tight">
          Wrap Tension Score
        </h1>
        <p className="text-stone-600 text-lg">Burrito structural integrity, quantified.</p>
      </div>

      {!preview && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-stone-300 rounded-2xl p-12 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all bg-white shadow-sm"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
              <Upload className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-stone-800 text-lg">Upload a burrito photo</p>
              <p className="text-stone-500 text-sm mt-1">
                Take a photo or pick one from your library
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

      {preview && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="relative">
            <img
              src={preview}
              alt="Burrito candidate"
              className="w-full h-64 sm:h-80 object-cover"
            />
            {loading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-white text-center">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3" />
                  <p className="font-medium">Analyzing structural integrity...</p>
                  <p className="text-sm text-white/70 mt-1">
                    Measuring wrap tension across all axes
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 flex gap-2">
            {!result && !loading && (
              <button
                onClick={analyze}
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
              {result ? 'Try Another' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Analysis failed</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <>
          <ScoreCard burrito={result} />
          <PostScanCTA result={result} />
        </>
      )}

      <p className="text-center text-xs text-stone-400 mt-6">
        Powered by Claude vision · structural integrity guaranteed*
      </p>
    </div>
  )
}

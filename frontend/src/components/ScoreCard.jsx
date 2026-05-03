import { CheckCircle2, XCircle } from 'lucide-react'
import { scoreColor, scoreBg, labelize } from '../lib/format'

export default function ScoreCard({ burrito }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {burrito.image_url && (
        <img
          src={burrito.image_url}
          alt="Scored burrito"
          className="w-full h-64 sm:h-80 object-cover"
        />
      )}

      <div className={`p-5 border-b ${burrito.is_burrito ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
        <div className="flex items-center gap-3">
          {burrito.is_burrito ? (
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-bold text-stone-900">
              {burrito.is_burrito
                ? 'Burrito confirmed'
                : `Not a burrito — detected: ${burrito.detected_object}`}
            </p>
            <p className="text-sm text-stone-600">Confidence: {burrito.confidence}%</p>
          </div>
        </div>
      </div>

      {burrito.is_burrito && burrito.overall_wts != null && (
        <>
          <div className="p-6 text-center border-b border-stone-100">
            <p className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-2">
              Wrap Tension Score
            </p>
            <div className={`text-7xl font-black ${scoreColor(burrito.overall_wts)}`}>
              {Math.round(burrito.overall_wts)}
            </div>
            <p className="text-stone-700 italic mt-3 text-base">"{burrito.diagnosis}"</p>
            {burrito.minutes_until_failure != null && (
              <p className="text-sm text-stone-500 mt-2">
                Estimated time until structural failure:{' '}
                <span className="font-semibold text-stone-700">
                  {burrito.minutes_until_failure} min
                </span>
              </p>
            )}
          </div>

          {burrito.scores && (
            <div className="p-6 space-y-4">
              <p className="text-sm font-semibold text-stone-700 uppercase tracking-wider">
                Diagnostic Breakdown
              </p>
              {Object.entries(burrito.scores).map(([key, score]) => (
                <div key={key}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-sm font-medium text-stone-700 capitalize">
                      {labelize(key)}
                    </span>
                    <span className={`font-bold ${scoreColor(score)}`}>{Math.round(score)}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${scoreBg(score)} transition-all duration-700`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!burrito.is_burrito && (
        <div className="p-6 text-center">
          <p className="text-stone-700 italic">"{burrito.diagnosis}"</p>
          <p className="text-sm text-stone-500 mt-3">Try uploading an actual burrito.</p>
        </div>
      )}
    </div>
  )
}

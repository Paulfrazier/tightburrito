import { Link } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { scoreColor, timeAgo } from '../lib/format'

const RANK_MEDALS = { 1: 'ring-yellow-400', 2: 'ring-stone-400', 3: 'ring-amber-600' }
const RANK_BG = { 1: 'bg-yellow-50', 2: 'bg-stone-50', 3: 'bg-amber-50' }

export default function BurritoCard({ burrito, rank }) {
  const hasMedal = rank != null && rank <= 3
  const ringClass = hasMedal ? `ring-2 ${RANK_MEDALS[rank]}` : ''
  const bgClass = hasMedal ? RANK_BG[rank] : 'bg-white'

  return (
    <Link
      to={`/b/${burrito.id}`}
      className={`flex flex-col sm:flex-row rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow ${bgClass} ${ringClass}`}
    >
      {/* Image / placeholder */}
      <div className="w-full sm:w-36 sm:flex-shrink-0 h-48 sm:h-auto relative">
        {burrito.image_url ? (
          <img
            src={burrito.image_url}
            alt="Burrito"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-orange-100 flex items-center justify-center">
            <Camera className="w-10 h-10 text-orange-300" />
          </div>
        )}
        {rank != null && (
          <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-stone-900/70 flex items-center justify-center">
            <span className="text-white text-xs font-black">#{rank}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between p-4 flex-1 min-w-0">
        <div>
          {/* WTS */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className={`text-4xl font-black leading-none ${scoreColor(burrito.overall_wts)}`}>
              {burrito.overall_wts ?? '—'}
            </span>
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">WTS</span>
          </div>

          {/* Diagnosis */}
          {burrito.diagnosis && (
            <p className="text-sm text-stone-600 italic truncate mt-1">
              "{burrito.diagnosis}"
            </p>
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between mt-3 gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-xs text-stone-400 truncate">
              🌯 {burrito.owner_display_name ?? 'anonymous'}
            </span>
            <span className="text-stone-300 text-xs">·</span>
            <span className="text-xs text-stone-400 whitespace-nowrap">
              {timeAgo(burrito.created_at)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-400 whitespace-nowrap flex-shrink-0">
            <span>↑ {burrito.upvotes}</span>
            <span>↓ {burrito.downvotes}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

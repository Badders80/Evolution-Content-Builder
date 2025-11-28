/**
 * Flashcards Viewer - Interactive study cards
 */
import { useState } from 'react'
import type { FlashcardsResponse } from '../../lib/studioApi'

interface FlashcardsViewerProps {
  data: FlashcardsResponse
}

export default function FlashcardsViewer({ data }: FlashcardsViewerProps) {
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set())

  const card = data.cards[currentCard]

  const handleFlip = () => {
    setFlipped(!flipped)
  }

  const handleNext = () => {
    if (currentCard < data.cards.length - 1) {
      setCurrentCard((prev) => prev + 1)
      setFlipped(false)
    }
  }

  const handlePrev = () => {
    if (currentCard > 0) {
      setCurrentCard((prev) => prev - 1)
      setFlipped(false)
    }
  }

  const handleMarkKnown = () => {
    setKnownCards((prev) => new Set([...prev, currentCard]))
    handleNext()
  }

  const handleReset = () => {
    setCurrentCard(0)
    setFlipped(false)
    setKnownCards(new Set())
  }

  const remainingCards = data.cards.length - knownCards.size

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-800">🃏 Flashcards</h3>
        <span className="text-sm text-gray-500">
          {remainingCards} remaining • {knownCards.size} known
        </span>
      </div>

      {/* Card */}
      <div
        onClick={handleFlip}
        className={`
          relative cursor-pointer min-h-[200px] rounded-lg p-6 
          transition-all duration-300 transform
          ${flipped ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}
          border-2 flex items-center justify-center text-center
          ${knownCards.has(currentCard) ? 'opacity-50' : ''}
        `}
      >
        <div>
          {!flipped ? (
            <>
              <p className="text-lg font-medium text-gray-800">{card.front}</p>
              <p className="text-xs text-gray-400 mt-4">Click to reveal answer</p>
            </>
          ) : (
            <>
              <p className="text-lg text-gray-800">{card.back}</p>
              {card.category && (
                <span className="inline-block mt-3 text-xs bg-gray-200 px-2 py-1 rounded">
                  {card.category}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={handlePrev}
          disabled={currentCard === 0}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50"
        >
          ← Previous
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleMarkKnown}
            disabled={knownCards.has(currentCard)}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded disabled:opacity-50"
          >
            ✓ Got it
          </button>
          <button
            onClick={handleNext}
            disabled={currentCard === data.cards.length - 1}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >
            Skip →
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="flex gap-1">
          {data.cards.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded ${
                knownCards.has(i)
                  ? 'bg-green-500'
                  : i === currentCard
                  ? 'bg-blue-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-center text-gray-500 mt-2">
          Card {currentCard + 1} of {data.total_cards}
        </p>
      </div>

      {knownCards.size === data.cards.length && (
        <div className="mt-4 text-center">
          <p className="text-green-600 font-medium mb-2">All cards complete!</p>
          <button
            onClick={handleReset}
            className="text-sm text-blue-600 hover:underline"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  )
}

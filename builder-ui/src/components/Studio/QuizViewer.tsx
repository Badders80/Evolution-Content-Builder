/**
 * Quiz Viewer - Interactive quiz from generated questions
 */
import { useState } from 'react'
import type { QuizResponse } from '../../lib/studioApi'

interface QuizViewerProps {
  data: QuizResponse
}

export default function QuizViewer({ data }: QuizViewerProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [score, setScore] = useState(0)
  const [completed, setCompleted] = useState(false)

  const question = data.questions[currentQuestion]

  const handleSelectAnswer = (answer: string) => {
    if (showAnswer) return
    setSelectedAnswer(answer)
  }

  const handleCheckAnswer = () => {
    if (!selectedAnswer) return
    setShowAnswer(true)
    
    const isCorrect = selectedAnswer.startsWith(question.correct_answer) || 
                      selectedAnswer === question.correct_answer
    if (isCorrect) {
      setScore((prev) => prev + 1)
    }
  }

  const handleNext = () => {
    if (currentQuestion < data.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
      setSelectedAnswer(null)
      setShowAnswer(false)
    } else {
      setCompleted(true)
    }
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowAnswer(false)
    setScore(0)
    setCompleted(false)
  }

  if (completed) {
    const percentage = Math.round((score / data.questions.length) * 100)
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-bold mb-2">Quiz Complete!</h3>
        <p className="text-3xl font-bold text-blue-600 mb-2">
          {score} / {data.questions.length}
        </p>
        <p className="text-gray-600 mb-4">{percentage}% correct</p>
        <button
          onClick={handleRestart}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-800">❓ Quiz</h3>
        <span className="text-sm text-gray-500">
          Question {currentQuestion + 1} of {data.total_questions}
        </span>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <p className="font-medium mb-4">{question.question}</p>

        {question.type === 'multiple_choice' && question.options && (
          <div className="space-y-2">
            {question.options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleSelectAnswer(option)}
                className={`w-full text-left p-3 rounded border transition-all ${
                  selectedAnswer === option
                    ? showAnswer
                      ? option.startsWith(question.correct_answer)
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-blue-500 bg-blue-50'
                    : showAnswer && option.startsWith(question.correct_answer)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {question.type === 'true_false' && (
          <div className="flex gap-4">
            {['True', 'False'].map((option) => (
              <button
                key={option}
                onClick={() => handleSelectAnswer(option)}
                className={`flex-1 p-3 rounded border transition-all ${
                  selectedAnswer === option
                    ? showAnswer
                      ? option === question.correct_answer
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-blue-500 bg-blue-50'
                    : showAnswer && option === question.correct_answer
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {showAnswer && question.explanation && (
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-800">{question.explanation}</p>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-4">
        {!showAnswer ? (
          <button
            onClick={handleCheckAnswer}
            disabled={!selectedAnswer}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {currentQuestion < data.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          </button>
        )}
        <span className="text-sm text-gray-500 self-center">Score: {score}</span>
      </div>
    </div>
  )
}

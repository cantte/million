import create from 'zustand'
import { CategoryService } from '../services/category.service'
import { Category, Question } from '../types'
import { useEffect } from 'react'
import { QuestionService } from '../services/question.service'

type GameStore = {
  category?: Category
  score: number

  currentQuestion: number
  maxQuestions: number

  questions: Question[]

  gameOver: boolean

  loadFirstCategory: () => Promise<void>
  loadNextCategory: () => Promise<void>

  loadQuestions: () => Promise<void>
}

export const useGameStore = create<GameStore>((set, get) => ({
  category: undefined,
  score: 0,
  currentQuestion: 1,
  maxQuestions: 5,
  questions: [],
  gameOver: false,

  loadFirstCategory: async () => {
    const category = await CategoryService.fetchFirst()
    set({ category })
  },

  loadNextCategory: async () => {
    const current = get().category
    const category = await CategoryService.fetchNext(current?.difficulty || 0)
    set({ category })
  },

  loadQuestions: async () => {
    const category = get().category
    if (category) {
      const questions = await QuestionService.fetchByCategory(category.id)
      set({ questions })
    }
  },

  validateAnswer: async (answerId: number) => {
    const result = await QuestionService.validateAnswer(answerId)
    if (result) {
      const currentQuestion = get().questions[get().currentQuestion]
      set({ score: get().score + currentQuestion.reward })

      if (get().currentQuestion < get().maxQuestions) {
        set({ currentQuestion: get().currentQuestion + 1 })
      } else {
        await get().loadNextCategory()
      }
    } else {
      set({ gameOver: true })
    }
  },

  reset: () => {
    set({
      category: undefined,
      score: 0,
      currentQuestion: 1,
      maxQuestions: 5,
      questions: [],
      gameOver: false,
    })
  },
}))

export const useCategory = () => {
  const loadFirstCategory = useGameStore(x => x.loadFirstCategory)
  const category = useGameStore(x => x.category)

  useEffect(() => {
    if (!category) {
      loadFirstCategory().then()
    }
  }, [loadFirstCategory, category])

  return category
}

type GameState = {
  score: number

  currentQuestion: number
  maxQuestions: number
}

export const useGameState = () =>
  useGameStore<GameState>(state => ({
    score: state.score,
    currentQuestion: state.currentQuestion,
    maxQuestions: state.maxQuestions,
  }))

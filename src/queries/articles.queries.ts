import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Article, ArticleCategory, ArticleCategoryInput, ArticleInput } from '@/types/api'
import { keys } from './keys'

// ─── دسته‌بندی‌ها ────────────────────────────────────────────────────────────

export function useArticleCategories() {
  return useQuery({
    queryKey: keys.articles.categories(),
    queryFn: () => api.get<ArticleCategory[]>('/admin/article-categories').then((r) => r.data),
  })
}

export function useCreateArticleCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ArticleCategoryInput) =>
      api.post<ArticleCategory>('/admin/article-categories', data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.articles.categories() }),
  })
}

export function useUpdateArticleCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ArticleCategoryInput> }) =>
      api.patch<ArticleCategory>(`/admin/article-categories/${id}`, data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.articles.categories() }),
  })
}

export function useDeleteArticleCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/article-categories/${id}`).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.articles.categories() }),
  })
}

// ─── مقالات ──────────────────────────────────────────────────────────────────

export function useArticles() {
  return useQuery({
    queryKey: keys.articles.list(),
    queryFn: () => api.get<Article[]>('/admin/articles').then((r) => r.data),
  })
}

export function useCreateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ArticleInput) => api.post<Article>('/admin/articles', data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.articles.list() }),
  })
}

export function useUpdateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ArticleInput> }) =>
      api.patch<Article>(`/admin/articles/${id}`, data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.articles.list() }),
  })
}

export function useDeleteArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/articles/${id}`).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.articles.list() }),
  })
}

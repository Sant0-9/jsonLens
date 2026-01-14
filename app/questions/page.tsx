"use client"

import { useEffect, useState, useMemo } from 'react'
import { useQuestionsStore } from '@/store/questions-store'
import { useNotesStore } from '@/store/notes-store'
import { useExperimentsStore } from '@/store/experiments-store'
import { QuestionCard } from '@/components/questions/question-card'
import { QuestionForm } from '@/components/questions/question-form'
import { QuestionDetail } from '@/components/questions/question-detail'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  HelpCircle,
  SortAsc,
  SortDesc,
  CheckCircle,
  Clock,
  Lightbulb,
} from 'lucide-react'
import type { ResearchQuestion } from '@/lib/db/schema'

export default function QuestionsPage() {
  const {
    isLoading,
    filterStatus,
    filterPriority,
    searchQuery,
    sortBy,
    sortOrder,
    selectedQuestionId,
    loadQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    setFilterStatus,
    setFilterPriority,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    selectQuestion,
    getFilteredQuestions,
    getQuestionsByStatus,
  } = useQuestionsStore()

  const { notes, loadNotes } = useNotesStore()
  const { experiments, loadExperiments } = useExperimentsStore()

  const [mounted, setMounted] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<ResearchQuestion | undefined>()

  useEffect(() => {
    setMounted(true)
    loadQuestions()
    loadNotes()
    loadExperiments()
  }, [loadQuestions, loadNotes, loadExperiments])

  const filteredQuestions = getFilteredQuestions()
  const statusCounts = getQuestionsByStatus()
  const selectedQuestion = filteredQuestions.find(q => q.id === selectedQuestionId) ||
    useQuestionsStore.getState().questions.find(q => q.id === selectedQuestionId)

  // Get linked data for selected question
  const linkedData = useMemo(() => {
    if (!selectedQuestion) {
      return { papers: [], notes: [], experiments: [] }
    }

    return {
      papers: selectedQuestion.linkedPapers.map(id => ({
        id,
        title: `Paper ${id.slice(-6)}`, // Would need to load from papers store
      })),
      notes: selectedQuestion.linkedNotes
        .map(id => {
          const note = notes.find(n => n.id === id)
          return note ? { id: note.id, title: note.title } : null
        })
        .filter((n): n is { id: string; title: string } => n !== null),
      experiments: selectedQuestion.linkedExperiments
        .map(id => {
          const exp = experiments.find(e => e.id === id)
          return exp ? { id: exp.id, name: exp.name } : null
        })
        .filter((e): e is { id: string; name: string } => e !== null),
    }
  }, [selectedQuestion, notes, experiments])

  const handleCreate = async (data: Partial<ResearchQuestion>) => {
    await createQuestion(data)
    setShowForm(false)
  }

  const handleEdit = async (data: Partial<ResearchQuestion>) => {
    if (editingQuestion) {
      await updateQuestion(editingQuestion.id, data)
      setEditingQuestion(undefined)
      setShowForm(false)
    }
  }

  const handleDelete = async (id: string) => {
    const question = getFilteredQuestions().find(q => q.id === id)
    if (question && confirm(`Delete this question?`)) {
      await deleteQuestion(id)
    }
  }

  const handleArchive = async (id: string) => {
    await updateQuestion(id, { status: 'archived' })
  }

  const openEdit = (question: ResearchQuestion) => {
    setEditingQuestion(question)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingQuestion(undefined)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h1 className="text-lg font-semibold">Research Questions</h1>
            <p className="text-sm text-muted-foreground">
              Track open questions and their answers
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Question
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 p-4 border-b">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <HelpCircle className="h-4 w-4" />
                Open
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-500">{statusCounts.open}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Lightbulb className="h-4 w-4" />
                Exploring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-500">{statusCounts.exploring}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Partial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-500">{statusCounts.partially_answered}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Answered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">{statusCounts.answered}</p>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-4 border-b">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="pl-9"
            />
          </div>

          <Select
            value={filterStatus}
            onValueChange={(v: ResearchQuestion['status'] | 'all') => setFilterStatus(v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="exploring">Exploring</SelectItem>
              <SelectItem value="partially_answered">Partial</SelectItem>
              <SelectItem value="answered">Answered</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterPriority}
            onValueChange={(v: ResearchQuestion['priority'] | 'all') => setFilterPriority(v)}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(v: 'updated' | 'created' | 'priority') => setSortBy(v)}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Modified</SelectItem>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Questions List */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                Loading questions...
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <HelpCircle className="h-12 w-12 mb-4" />
                {searchQuery || filterStatus !== 'all' || filterPriority !== 'all' ? (
                  <>
                    <p className="text-lg">No questions found</p>
                    <p className="text-sm mt-1">Try adjusting your filters</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg">No research questions yet</p>
                    <p className="text-sm mt-1">
                      Start by asking what you want to figure out
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQuestions.map(question => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onEdit={() => openEdit(question)}
                    onDelete={() => handleDelete(question.id)}
                    onArchive={() => handleArchive(question.id)}
                    onClick={() => selectQuestion(question.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Detail Panel */}
      {selectedQuestion && (
        <div className="w-96 border-l">
          <QuestionDetail
            question={selectedQuestion}
            onEdit={() => openEdit(selectedQuestion)}
            onClose={() => selectQuestion(null)}
            linkedData={linkedData}
          />
        </div>
      )}

      {/* Form Dialog */}
      <QuestionForm
        open={showForm}
        onClose={closeForm}
        onSubmit={editingQuestion ? handleEdit : handleCreate}
        initialData={editingQuestion}
      />
    </div>
  )
}

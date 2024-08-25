'use client'

import React, { useState, useCallback, useEffect, Suspense, useMemo } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Moon, Sun, Upload, Download, Trash2, Search, Check, X, Plus, Save, FolderOpen, BarChart2, Globe, Book, Eye, GitBranch, Zap, Settings, LogOut, ChevronDown, Edit, Trash, FileText, History, Users, GitCommit, AlertTriangle, Github, Gitlab, Database, Brain, HelpCircle, User, Sliders, Loader } from 'lucide-react'
import OpenAI from 'openai'
//import { Client as AnthropicClient } from '@anthropic-ai/sdk'
import JSZip from 'jszip'
import { useTranslation, Trans, initReactI18next } from 'react-i18next'
import i18n from 'i18next'
import { Line, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { ErrorBoundary } from 'react-error-boundary'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
})

// Anthropic configuration
// const anthropic = new AnthropicClient(process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY)

// Fallback translations
const fallbackTranslations = {
  en: {
    common: {
      title: "AI Language File Translator",
      toggleDarkMode: "Toggle dark mode",
      featureRequest: "Feature Request",
      featureRequestTitle: "Request a New Feature",
      featureRequestDescription: "We value your input! Let us know what features you'd like to see.",
      featureRequestLabel: "Feature Description",
      featureRequestPlaceholder: "Describe the feature you'd like...",
      submit: "Submit",
      uploadFiles: "Upload Files",
      dragDropInstructions: "Drag & drop files here, or click to select files",
      selectLanguages: "Select Languages",
      searchLanguages: "Search languages...",
      selectAll: "Select All",
      deselectAll: "Deselect All",
      generateTranslations: "Generate Translations",
      startTranslation: "Start Translation",
      translatingProgress: "Translating... {{progress}}% complete",
      downloadFiles: "Download Files",
      downloadZip: "Download Zip",
      footer: "© 2023 AI Language File Translator. All rights reserved.",
      menu: {
        dashboard: "Dashboard",
        translator: "Translator",
        projects: "Projects",
        analytics: "Analytics",
        settings: "Settings",
        translationMemory: "Translation Memory",
        glossary: "Glossary",
        teamManagement: "Team Management",
      },
      user: {
        settings: "User Settings",
        theme: "Theme",
        language: "Language",
        documentation: "Documentation",
        help: "Help",
        logout: "Log Out",
        profile: "Profile",
      },
    },
  },
}

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: fallbackTranslations,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  })

interface Language {
  code: string
  name: string
  proficiencyLevels: string[]
  dialects: string[]
}

interface TranslationMemoryEntry {
  id: string
  source: string
  target: string
  language: string
  lastUsed: Date
  similarity?: number
}

interface GlossaryEntry {
  id: string
  term: string
  definition: string
  language: string
  category: string
}

interface Project {
  id: string
  name: string
  files: string[]
  selectedLanguages: string[]
  version: number
  createdAt: Date
  updatedAt: Date
  collaborators: User[]
  translations: { [key: string]: TranslationMemoryEntry[] }
}

interface AnalyticsData {
  projectCount: number
  totalTranslations: number
  languageUsage: { [key: string]: number }
  translationEfficiency: number[]
  translationSpeedPerLanguage: { [key: string]: number }
  qualityScores: { [key: string]: number }
  userProductivity: { [key: string]: number }
}

interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: 'admin' | 'translator' | 'reviewer'
}

interface Version {
  id: string
  projectId: string
  number: number
  changes: string
  createdAt: Date
  createdBy: User
}

interface QualityCheckResult {
  type: 'consistency' | 'completeness' | 'formatting' | 'ai'
  severity: 'low' | 'medium' | 'high'
  message: string
  location: string
  suggestion?: string
}

interface LongRunningTask {
  id: string
  type: 'translation' | 'aiModelTuning' | 'qualityCheck'
  progress: number
  status: 'pending' | 'inProgress' | 'completed' | 'failed'
  message: string
}

interface ErrorLog {
  id: string
  timestamp: Date
  message: string
  stack?: string
  userId?: string
  context?: any
}

interface TerminologyEntry extends GlossaryEntry {
  usage: string[]
  notes: string
}

interface AIPreferences {
  provider: 'openai' | 'anthropic'
  model: string
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
}

const TRANSLATION_SYSTEM_MESSAGE = "You are a translation assistant. Translate the given content to the specified language. Return the result in the same format as the input."
const QUALITY_CHECK_SYSTEM_MESSAGE = "You are a translation quality assurance expert. Analyze the source and translated content for potential issues. Return the results in the following format:"
const QUALITY_CHECK_EXAMPLE = `
[
  {
    "severity": "high",
    "message": "The translation has incorrect grammar in the first sentence.",
    "location": {
      "start": 0,
      "end": 15
    },
    "suggestion": "Consider rephrasing to 'The quick brown fox jumps over the lazy dog.'"
  },
  {
    "severity": "medium",
    "message": "The term 'fox' might be culturally inappropriate in the target language.",
    "location": {
      "start": 16,
      "end": 19
    },
    "suggestion": "Consider replacing 'fox' with a more culturally neutral animal."
  }
]
`

export default function TranslatorPage() {
  const [files, setFiles] = useState<File[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [translationProgress, setTranslationProgress] = useState(0)
  const [darkMode, setDarkMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [projectName, setProjectName] = useState('')
  const [translationMemory, setTranslationMemory] = useState<TranslationMemoryEntry[]>([])
  const [glossary, setGlossary] = useState<GlossaryEntry[]>([])
  const [previewContent, setPreviewContent] = useState<string>('')
  const [currentVersion, setCurrentVersion] = useState(1)
  const [projects, setProjects] = useState<Project[]>([])
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    projectCount: 0,
    totalTranslations: 0,
    languageUsage: {},
    translationEfficiency: [],
    translationSpeedPerLanguage: {},
    qualityScores: {},
    userProductivity: {},
  })
  const [activeTab, setActiveTab] = useState('dashboard')
  const [currentUser, setCurrentUser] = useState<User>({
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '/placeholder.svg?height=32&width=32',
    role: 'admin'
  })
  const [collaborators, setCollaborators] = useState<User[]>([])
  const [versions, setVersions] = useState<Version[]>([])
  const [qualityCheckResults, setQualityCheckResults] = useState<QualityCheckResult[]>([])
  const [longRunningTasks, setLongRunningTasks] = useState<LongRunningTask[]>([])
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [terminology, setTerminology] = useState<TerminologyEntry[]>([])
  const [aiPreferences, setAIPreferences] = useState<AIPreferences>({
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2500,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  })
  const [isAIPreferencesOpen, setIsAIPreferencesOpen] = useState(false)
  const [translationMode, setTranslationMode] = useState<'file' | 'key'>('file')
  const [isTranslating, setIsTranslating] = useState(false)
  const { toast } = useToast()
  const { t, i18n } = useTranslation()

  const languages: Language[] = [
    { code: 'en', name: 'English', proficiencyLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], dialects: ['US', 'UK', 'AU'] },
    { code: 'es', name: 'Spanish', proficiencyLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], dialects: ['ES', 'MX', 'AR'] },
    { code: 'fr', name: 'French', proficiencyLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], dialects: ['FR', 'CA', 'BE'] },
    { code: 'de', name: 'German', proficiencyLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], dialects: ['DE', 'AT', 'CH'] },
    { code: 'it', name: 'Italian', proficiencyLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], dialects: ['IT', 'CH'] },
    { code: 'pt', name: 'Portuguese', proficiencyLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], dialects: ['PT', 'BR'] },
    { code: 'nl', name: 'Dutch', proficiencyLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], dialects: ['NL', 'BE'] },
    { code: 'ru', name: 'Russian', proficiencyLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], dialects: ['RU'] },
    { code: 'zh', name: 'Chinese', proficiencyLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], dialects: ['CN', 'TW', 'HK'] },
    { code: 'ja', name: 'Japanese', proficiencyLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], dialects: ['JP'] },
    { code: 'ko', name: 'Korean', proficiencyLevels: ['A1', 'A2', 'B1', 'B2', 'C1',
 'C2'], dialects: ['KR'] },
    { code: 'ar', name: 'Arabic', proficiencyLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], dialects: ['SA', 'EG', 'MA'] },
  ]

  const filteredLanguages = useMemo(() => 
    languages.filter(lang => 
      lang.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [languages, searchTerm]
  )

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.filter(file => 
      file.type === 'application/json' || 
      file.name.endsWith('.yaml') || 
      file.name.endsWith('.yml') || 
      file.name.endsWith('.xml') || 
      file.name.endsWith('.properties')
    )
    if (newFiles.length !== acceptedFiles.length) {
      toast({
        title: t('invalidFileType'),
        description: t('onlySupportedFormatsAccepted'),
        variant: "destructive",
      })
    }
    setFiles(prevFiles => [...prevFiles, ...newFiles])
  }, [toast, t])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {
    'application/json': ['.json'],
    'text/yaml': ['.yaml', '.yml'],
    'application/xml': ['.xml'],
    'text/plain': ['.properties']
  } })

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
  }

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguages(prevLanguages => 
      prevLanguages.includes(language)
        ? prevLanguages.filter(lang => lang !== language)
        : [...prevLanguages, language]
    )
  }

  const startTranslation = async () => {
    if (files.length === 0 || selectedLanguages.length === 0) {
      toast({
        title: t('error'),
        description: t('uploadFilesAndSelectLanguages'),
        variant: "destructive",
      })
      return
    }

    setIsTranslating(true)
    const taskId = Date.now().toString()
    setLongRunningTasks(prev => [...prev, {
      id: taskId,
      type: 'translation',
      progress: 0,
      status: 'inProgress',
      message: 'Translation started'
    }])

    toast({
      title: t('translationStarted'),
      description: t('translationInProgress'),
    })

    let progress = 0
    const totalOperations = files.length * selectedLanguages.length
    const startTime = Date.now()

    const newTranslations: { [key: string]: TranslationMemoryEntry[] } = {}

    try {
      if (translationMode === 'file') {
        for (const file of files) {
          const content = await readFileContent(file)
          for (const language of selectedLanguages) {
            const translatedContent = await translateContent(content, language)
            Object.entries(translatedContent).forEach(([key, value]) => {
              const newEntry = { 
                id: `${content[key]}_${language}`,
                source: content[key], 
                target: value as string, 
                language,
                lastUsed: new Date()
              }
              setTranslationMemory(prev => [
                ...prev.filter(entry => entry.source !== content[key] || entry.language !== language),
                newEntry
              ])
              if (!newTranslations[language]) {
                newTranslations[language] = []
              }
              newTranslations[language].push(newEntry)
            })
            progress++
            const progressPercentage = Math.round((progress / totalOperations) * 100)
            setTranslationProgress(progressPercentage)
            setLongRunningTasks(prev => prev.map(task => 
              task.id === taskId ? { ...task, progress: progressPercentage } : task
            ))
          }
        }
      } else { // key-by-key mode
        for (const file of files) {
          const content = await readFileContent(file)
          const translatedContents: { [lang: string]: any } = {}
          
          for (const key of Object.keys(content)) {
            for (const language of selectedLanguages) {
              const translatedKey = await translateContent({ [key]: content[key] }, language)
              if (!translatedContents[language]) {
                translatedContents[language] = {}
              }
              translatedContents[language][key] = translatedKey[key]
              
              const newEntry = { 
                id: `${content[key]}_${language}`,
                source: content[key], 
                target: translatedKey[key] as string, 
                language,
                lastUsed: new Date()
              }
              setTranslationMemory(prev => [
                ...prev.filter(entry => entry.source !== content[key] || entry.language !== language),
                newEntry
              ])
              if (!newTranslations[language]) {
                newTranslations[language] = []
              }
              newTranslations[language].push(newEntry)
              
              progress++
              const progressPercentage = Math.round((progress / totalOperations) * 100)
              setTranslationProgress(progressPercentage)
              setLongRunningTasks(prev => prev.map(task => 
                task.id === taskId ? { ...task, progress: progressPercentage } : task
              ))
            }
          }
        }
      }

      const endTime = Date.now()
      const totalTime = (endTime - startTime) / 1000 // in seconds

      setLongRunningTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: 'completed', message: 'Translation completed' } : task
      ))

      toast({
        title: t('translationComplete'),
        description: t('translationSuccessful'),
      })

      setAnalyticsData(prev => {
        const newLanguageUsage = { ...prev.languageUsage }
        const newTranslationSpeedPerLanguage = { ...prev.translationSpeedPerLanguage }
        selectedLanguages.forEach(lang => {
          newLanguageUsage[lang] = (newLanguageUsage[lang] || 0) + files.length
          newTranslationSpeedPerLanguage[lang] = totalTime / files.length
        })

        return {
          ...prev,
          totalTranslations: prev.totalTranslations + totalOperations,
          languageUsage: newLanguageUsage,
          translationEfficiency: [...prev.translationEfficiency, totalOperations / totalTime],
          translationSpeedPerLanguage: newTranslationSpeedPerLanguage,
          userProductivity: {
            ...prev.userProductivity,
            [currentUser.name]: (prev.userProductivity[currentUser.name] || 0) + totalOperations
          }
        }
      })

      // Create a new version after translation
      createNewVersion(`Translated ${files.length} files to ${selectedLanguages.join(', ')}`, newTranslations)

      // Run AI-powered quality checks
      await runAIQualityChecks()
    } catch (error) {
      console.error('Translation error:', error)
      toast({
        title: t('translationError'),
        description: t('errorDuringTranslation'),
        variant: "destructive",
      })
      setLongRunningTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: 'failed', message: 'Translation failed' } : task
      ))
    } finally {
      setIsTranslating(false)
    }
  }

  const translateContent = async (content: any, targetLanguage: string) => {
    try {
      const translatedContent = { ...content }
      let translationNeeded = false

      for (const [key, value] of Object.entries(content)) {
        const memoryEntry = findBestTranslationMemoryMatch(value as string, targetLanguage)
        if (memoryEntry && memoryEntry.similarity && memoryEntry.similarity >= 0.9) {
          translatedContent[key] = memoryEntry.target
          // Update last used date
          setTranslationMemory(prev => 
            prev.map(entry => 
              entry.id === memoryEntry.id 
                ? { ...entry, lastUsed: new Date() } 
                : entry
            )
          )
        } else {
          translationNeeded = true
        }
      }

      if (!translationNeeded) {
        return translatedContent
      }

      const glossaryPrompt = createGlossaryPrompt(content, targetLanguage)

      let response
      if (aiPreferences.provider === 'openai') {
        response = await openai.chat.completions.create({
          model: aiPreferences.model,
          messages: [
            { role: 'system', content: TRANSLATION_SYSTEM_MESSAGE },
            { role: 'user', content: `Translate the following to ${targetLanguage}:\n${JSON.stringify(content)}\n\nGlossary:\n${glossaryPrompt}` }
          ],
          temperature: aiPreferences.temperature,
          max_tokens: aiPreferences.maxTokens,
          top_p: aiPreferences.topP,
          frequency_penalty: aiPreferences.frequencyPenalty,
          presence_penalty: aiPreferences.presencePenalty,
        })
        return JSON.parse(response.choices[0].message.content || '{}')
      } else if (aiPreferences.provider === 'anthropic') {
        // response = await anthropic.chat.completions.create({
      }

      throw new Error('Invalid AI provider')
    } catch (error) {
      console.error('Translation error:', error)
      logError('Translation error', (error as Error).message, { targetLanguage })
      throw new Error(t('failedToTranslateContent'))
    }
  }

  const findBestTranslationMemoryMatch = (source: string, targetLanguage: string): TranslationMemoryEntry | null => {
    let bestMatch: TranslationMemoryEntry | null = null
    let highestSimilarity = 0

    for (const entry of translationMemory) {
      if (entry.language === targetLanguage) {
        const similarity = calculateSimilarity(source, entry.source)
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity
          bestMatch = { ...entry, similarity }
        }
      }
    }

    return bestMatch
  }

  const calculateSimilarity = (str1: string, str2: string): number => {
    const distance = levenshteinDistance(str1, str2)
    const maxLength = Math.max(str1.length, str2.length)
    return 1 - distance / maxLength
  }

  const levenshteinDistance = (str1: string, str2: string): number => {
    const m = str1.length
    const n = str2.length
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

    for (let i = 0; i <= m; i++) {
      dp[i][0] = i
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j
    }

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1]
        } else {
          dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]) + 1
        }
      }
    }

    return dp[m][n]
  }

  const createGlossaryPrompt = (content: any, targetLanguage: string): string => {
    const relevantTerms = glossary.filter(entry => 
      entry.language === targetLanguage && 
      Object.values(content).some(value => 
        typeof value === 'string' && value.toLowerCase().includes(entry.term.toLowerCase())
      )
    )

    return relevantTerms.map(term => `${term.term}: ${term.definition}`).join('\n')
  }

  const checkGlossaryConsistency = (source: any, translation: any, targetLanguage: string): string[] => {
    const issues: string[] = []

    glossary.forEach(entry => {
      if (entry.language === targetLanguage) {
        Object.entries(source).forEach(([key, value]) => {
          if (typeof value === 'string' && value.toLowerCase().includes(entry.term.toLowerCase())) {
            const translatedValue = translation[key]
            if (typeof translatedValue === 'string' && !translatedValue.toLowerCase().includes(entry.definition.toLowerCase())) {
              issues.push(`Glossary term "${entry.term}" not consistently translated in key "${key}"`)
            }
          }
        })
      }
    })

    return issues
  }

  const readFileContent = async (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string
          if (file.type === 'application/json' || file.name.endsWith('.json')) {
            resolve(JSON.parse(content))
          } else {
            // For now, we'll just return the raw content for other file types
            resolve(content)
          }
        } catch (error) {
          reject(new Error(t('invalidFileFormat')))
        }
      }
      reader.onerror = (error) => reject(error)
      reader.readAsText(file)
    })
  }

  const downloadFiles = async () => {
    const zip = new JSZip()

    for (const file of files) {
      const content = await readFileContent(file)
      for (const language of selectedLanguages) {
        const translatedContent = await translateContent(content, language)
        const folder = zip.folder(language.toLowerCase())
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          folder?.file(file.name, JSON.stringify(translatedContent, null, 2))
        } else {
          // For now, we'll just save the raw translated content for other file types
          folder?.file(file.name, translatedContent)
        }
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'translated_files.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const saveProject = () => {
    const project: Project = {
      id: Date.now().toString(),
      name: projectName,
      files: files.map(f => f.name),
      selectedLanguages,
      version: currentVersion,
      createdAt: new Date(),
      updatedAt: new Date(),
      collaborators: [currentUser],
      translations: {},
    }

    // Add current translations to the project
    selectedLanguages.forEach(lang => {
      project.translations[lang] = translationMemory.filter(entry => entry.language === lang)
    })

    setProjects(prev => [...prev, project])
    setCurrentVersion(1)
    toast({
      title: t('projectSaved'),
      description: t('projectSavedSuccessfully'),
    })

    setAnalyticsData(prev => ({
      ...prev,
      projectCount: prev.projectCount + 1
    }))
  }

  const loadProject = (project: Project) => {
    setProjectName(project.name)
    setSelectedLanguages(project.selectedLanguages)
    setCurrentVersion(project.version)
    setCollaborators(project.collaborators)

    // Load project translations into translation memory
    const newTranslationMemory = Object.values(project.translations).flat()
    setTranslationMemory(prevMemory => {
      const updatedMemory = [...prevMemory]
      newTranslationMemory.forEach(newEntry => {
        const existingIndex = updatedMemory.findIndex(entry => entry.id === newEntry.id)
        if (existingIndex !== -1) {
          updatedMemory[existingIndex] = newEntry
        } else {
          updatedMemory.push(newEntry)
        }
      })
      return updatedMemory
    })

    toast({
      title: t('projectLoaded'),
      description: t('projectLoadedSuccessfully'),
    })
  }

  const syncProjectTranslations = (projectId: string) => {
    setProjects(prevProjects => {
      return prevProjects.map(project => {
        if (project.id === projectId) {
          const updatedTranslations: { [key: string]: TranslationMemoryEntry[] } = {}
          project.selectedLanguages.forEach(lang => {
            updatedTranslations[lang] = translationMemory.filter(entry => entry.language === lang)
          })
          return { ...project, translations: updatedTranslations }
        }
        return project
      })
    })
  }

  const addGlossaryEntry = (term: string, definition: string, language: string, category: string) => {
    setGlossary(prev => [...prev, { 
      id: Date.now().toString(),
      term, 
      definition, 
      language, 
      category 
    }])
  }

  const updatePreview = async () => {
    if (files.length === 0 || selectedLanguages.length === 0) {
      setPreviewContent('')
      return
    }

    const file = files[0]
    const content = await readFileContent(file)
    const language = selectedLanguages[0]
    const translatedContent = await translateContent(content, language)
    setPreviewContent(JSON.stringify(translatedContent, null, 2))
  }

  const runQualityChecks = () => {
    const taskId = Date.now().toString()
    setLongRunningTasks(prev => [...prev, {
      id: taskId,
      type: 'qualityCheck',
      progress: 0,
      status: 'inProgress',
      message: 'Quality check started'
    }])

    const results: QualityCheckResult[] = []

    // Consistency check
    const uniqueTranslations = new Set(translationMemory.map(entry => entry.target))
    if (uniqueTranslations.size < translationMemory.length * 0.9) {
      results.push({
        type: 'consistency',
        severity: 'medium',
        message: 'Potential inconsistency in translations detected',
        location: 'Translation Memory'
      })
    }

    // Completeness check
    const missingTranslations = selectedLanguages.filter(lang => 
      !translationMemory.some(entry => entry.language === lang)
    )
    if (missingTranslations.length > 0) {
      results.push({
        type: 'completeness',
        severity: 'high',
        message: `Missing translations for languages: ${missingTranslations.join(', ')}`,
        location: 'Selected Languages'
      })
    }

    // Formatting check (simplified)
    const formattingIssues = translationMemory.filter(entry => 
      entry.target.includes('  ') || entry.target.startsWith(' ') || entry.target.endsWith(' ')
    )
    if (formattingIssues.length > 0) {
      results.push({
        type: 'formatting',
        severity: 'low',
        message: 'Potential formatting issues detected in translations',
        location: 'Translation Memory'
      })
    }

    setQualityCheckResults(results)
    setLongRunningTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: 'completed', progress: 100, message: 'Quality check completed' } : task
    ))

    toast({
      title: 'Quality Check Complete',
      description: `Found ${results.length} potential issues`,
    })
  }

  const runAIQualityChecks = async () => {
    const taskId = Date.now().toString()
    setLongRunningTasks(prev => [...prev, {
      id: taskId,
      type: 'qualityCheck',
      progress: 0,
      status: 'inProgress',
      message: 'AI Quality check started'
    }])

    const results: QualityCheckResult[] = []

    for (const file of files) {
      const content = await readFileContent(file)
      for (const language of selectedLanguages) {
        try {
          const translatedContent = await translateContent(content, language)
          const aiCheckResult = await performAIQualityCheck(content, translatedContent, language)
          results.push(...aiCheckResult)
        } catch (error) {
          console.error('AI Quality check error:', error)
          logError('AI Quality check error', (error as Error).message, { file: file.name, language })
        }
      }
    }

    setQualityCheckResults(prev => [...prev, ...results])
    setLongRunningTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: 'completed', progress: 100, message: 'AI Quality check completed' } : task
    ))

    toast({
      title: 'AI Quality Check Complete',
      description: `Found ${results.length} potential issues`,
    })
  }

  const performAIQualityCheck = async (source: any, translation: any, language: string): Promise<QualityCheckResult[]> => {
    try {
      let response
      if (aiPreferences.provider === 'openai') {
        response = await openai.chat.completions.create({
          model: aiPreferences.model,
          messages: [
            { role: 'system', content: `${QUALITY_CHECK_SYSTEM_MESSAGE}\n\n${QUALITY_CHECK_EXAMPLE}` },
            { role: 'user', content: `Source (${language}):\n${JSON.stringify(source)}\n\nTranslation:\n${JSON.stringify(translation)}` }
          ],
          temperature: aiPreferences.temperature,
          max_tokens: aiPreferences.maxTokens,
          top_p: aiPreferences.topP,
          frequency_penalty: aiPreferences.frequencyPenalty,
          presence_penalty: aiPreferences.presencePenalty,
        })
        return JSON.parse(response.choices[0].message.content || '[]')
      } else if (aiPreferences.provider === 'anthropic') {
        response = await anthropic.completions.create({
          model: aiPreferences.model,
          prompt: `${QUALITY_CHECK_SYSTEM_MESSAGE}\n\n${QUALITY_CHECK_EXAMPLE}\n\nSource (${language}):\n${JSON.stringify(source)}\n\nTranslation:\n${JSON.stringify(translation)}\n\nQuality check results:`,
          max_tokens_to_sample: aiPreferences.maxTokens,
          temperature: aiPreferences.temperature,
          top_p: aiPreferences.topP,
        })
        return JSON.parse(response.completion)
      }

      throw new Error('Invalid AI provider')
    } catch (error) {
      console.error('AI Quality check error:', error)
      logError('AI Quality check error', (error as Error).message, { language })
      return []
    }
  }

  const suggestSourceTextImprovements = async (source: string): Promise<string> => {
    try {
      let response
      if (aiPreferences.provider === 'openai') {
        response = await openai.chat.completions.create({
          model: aiPreferences.model,
          messages: [
            { role: 'system', content: 'You are an expert in writing clear and translatable content. Suggest improvements to make the following text more suitable for translation.' },
            { role: 'user', content: source }
          ],
          temperature: aiPreferences.temperature,
          max_tokens: aiPreferences.maxTokens,
          top_p: aiPreferences.topP,
          frequency_penalty: aiPreferences.frequencyPenalty,
          presence_penalty: aiPreferences.presencePenalty,
        })
        return response.choices[0].message.content || ''
      } else if (aiPreferences.provider === 'anthropic') {
        response = await anthropic.completions.create({
          model: aiPreferences.model,
          prompt: `You are an expert in writing clear and translatable content. Suggest improvements to make the following text more suitable for translation:\n\n${source}\n\nSuggestions:`,
          max_tokens_to_sample: aiPreferences.maxTokens,
          temperature: aiPreferences.temperature,
          top_p: aiPreferences.topP,
        })
        return response.completion
      }

      throw new Error('Invalid AI provider')
    } catch (error) {
      console.error('Source text improvement suggestion error:', error)
      logError('Source text improvement suggestion error', (error as Error).message)
      return ''
    }
  }

  const suggestGlossaryEntries = async (content: string): Promise<GlossaryEntry[]> => {
    try {
      let response
      if (aiPreferences.provider === 'openai') {
        response = await openai.chat.completions.create({
          model: aiPreferences.model,
          messages: [
            { role: 'system', content: 'You are an expert in terminology management. Suggest glossary entries based on the following content.' },
            { role: 'user', content }
          ],
          temperature: aiPreferences.temperature,
          max_tokens: aiPreferences.maxTokens,
          top_p: aiPreferences.topP,
          frequency_penalty: aiPreferences.frequencyPenalty,
          presence_penalty: aiPreferences.presencePenalty,
        })
        return JSON.parse(response.choices[0].message.content || '[]')
      } else if (aiPreferences.provider === 'anthropic') {
        response = await anthropic.completions.create({
          model: aiPreferences.model,
          prompt: `You are an expert in terminology management. Suggest glossary entries based on the following content:\n\n${content}\n\nGlossary entries:`,
          max_tokens_to_sample: aiPreferences.maxTokens,
          temperature: aiPreferences.temperature,
          top_p: aiPreferences.topP,
        })
        return JSON.parse(response.completion)
      }

      throw new Error('Invalid AI provider')
    } catch (error) {
      console.error('Glossary entry suggestion error:', error)
      logError('Glossary entry suggestion error', (error as Error).message)
      return []
    }
  }

  const createNewVersion = (changes: string, newTranslations: { [key: string]: TranslationMemoryEntry[] }) => {
    const newVersion: Version = {
      id: Date.now().toString(),
      projectId: projects[projects.length - 1]?.id || 'default',
      number: currentVersion + 1,
      changes,
      createdAt: new Date(),
      createdBy: currentUser,
    }
    setVersions(prev => [...prev, newVersion])
    setCurrentVersion(newVersion.number)

    // Update the project with new translations
    if (projects.length > 0) {
      const updatedProjects = projects.map(project => 
        project.id === newVersion.projectId
          ? { ...project, translations: { ...project.translations, ...newTranslations } }
          : project
      )
      setProjects(updatedProjects)
    }
  }

  const exportTranslationMemory = () => {
    const data = JSON.stringify(translationMemory, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'translation_memory.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const importTranslationMemory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        try {
          const importedMemory = JSON.parse(content)
          setTranslationMemory(prev => [...prev, ...importedMemory])
          toast({
            title: 'Import Successful',
            description: `Imported ${importedMemory.length} translation memory entries`,
          })
        } catch (error) {
          toast({
            title: 'Import Failed',
            description: 'Invalid file format',
            variant: 'destructive',
          })
          logError('Import translation memory error', (error as Error).message)
        }
      }
      reader.readAsText(file)
    }
  }

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
  }

  const logError = (message: string, error: string, context?: any) => {
    const newError: ErrorLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      message,
      stack: error,
      userId: currentUser.id,
      context
    }
    setErrorLogs(prev => [...prev, newError])
    console.error('Error logged:', newError)
  }

  const addTerminologyEntry = (term: string, definition: string, language: string, category: string, usage: string[], notes: string) => {
    setTerminology(prev => [...prev, {
      id: Date.now().toString(),
      term,
      definition,
      language,
      category,
      usage,
      notes
    }])
  }

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault()
            saveProject()
            break
          case 'o':
            event.preventDefault()
            if (projects.length > 0) {
              loadProject(projects[projects.length - 1])
            }
            break
          case 'Enter':
            event.preventDefault()
            startTranslation()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [projects])

  useEffect(() => {
    updatePreview()
  }, [files, selectedLanguages])

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <div className={`flex h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <aside className="w-64 bg-gray-800 text-white p-6 flex flex-col">
          <div className="flex items-center mb-8">
            <Globe className="h-8 w-8 mr-2" />
            <h1 className="text-xl font-bold">{t('common:title')}</h1>
          </div>
          <nav className="flex-grow">
            <ul className="space-y-2">
              <li>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('dashboard')}>
                  <BarChart2 className="mr-2 h-4 w-4" />
                  {t('common:menu.dashboard')}
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('translator')}>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('common:menu.translator')}
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('projects')}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  {t('common:menu.projects')}
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('translationMemory')}>
                  <Book className="mr-2 h-4 w-4" />
                  {t('common:menu.translationMemory')}
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('glossary')}>
                  <FileText className="mr-2 h-4 w-4" />
                  {t('common:menu.glossary')}
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('analytics')}>
                  <BarChart2 className="mr-2 h-4 w-4" />
                  {t('common:menu.analytics')}
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('teamManagement')}>
                  <Users className="mr-2 h-4 w-4" />
                  {t('common:menu.teamManagement')}
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t('common:menu.settings')}
                </Button>
              </li>
            </ul>
          </nav>
          <div className="mt-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <Avatar className="w-8 h-8 mr-2">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-medium">{currentUser.name}</p>
                    <p className="text-xs text-gray-400">{currentUser.email}</p>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>{t('common:user.settings')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveTab('userProfile')}>
                  <User className="mr-2 h-4 w-4" />
                  {t('common:user.profile')}
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    {darkMode ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                    {t('common:user.theme')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setDarkMode(false)}>
                      <Sun className="mr-2 h-4 w-4" />
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDarkMode(true)}>
                      <Moon className="mr-2 h-4 w-4" />
                      Dark
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Globe className="mr-2 h-4 w-4" />
                    {t('common:user.language')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => changeLanguage('en')}>English</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => changeLanguage('es')}>Español</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => changeLanguage('fr')}>Français</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" />
                  {t('common:user.documentation')}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  {t('common:user.help')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('common:user.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        <main className="flex-grow p-8 overflow-auto">
          <Suspense fallback={<div>{t('loading')}</div>}>
            {activeTab === 'dashboard' && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">{t('common:menu.dashboard')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Recent Projects</h3>
                    <ul>
                      {projects.slice(-5).map(project => (
                        <li key={project.id} className="mb-2">
                          <Button variant="link" onClick={() => loadProject(project)}>{project.name}</Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Translation Progress</h3>
                    <Progress value={translationProgress} className="w-full" />
                    <p className="mt-2">{translationProgress}% Complete</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Key Metrics</h3>
                    <p>Total Projects: {analyticsData.projectCount}</p>
                    <p>Total Translations: {analyticsData.totalTranslations}</p>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'translator' && (
              <div>
                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">{t('common:uploadFiles')}</h2>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
                      isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                    <p className="mt-2">{t('common:dragDropInstructions')}</p>
                  </div>
                  {files.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {files.map((file, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded p-2">
                          <span>{file.name}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">{t('common:selectLanguages')}</h2>
                  <Input
                    type="text"
                    placeholder={t('common:searchLanguages')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-4"
                  />
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredLanguages.map(language => (
                      <div key={language.code} className="space-y-2">
                        <Button
                          variant={selectedLanguages.includes(language.name) ? "default" : "outline"}
                          onClick={() => handleLanguageSelect(language.name)}
                          className="w-full justify-start"
                        >
                          {selectedLanguages.includes(language.name) && <Check className="mr-2 h-4 w-4" />}
                          {language.name}
                        </Button>
                        {selectedLanguages.includes(language.name) && (
                          <div className="flex space-x-2">
                            <Select>
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder={t('proficiency')} />
                              </SelectTrigger>
                              <SelectContent>
                                {language.proficiencyLevels.map(level => (
                                  <SelectItem key={level} value={level}>{level}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select>
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder={t('dialect')} />
                              </SelectTrigger>
                              <SelectContent>
                                {language.dialects.map(dialect => (
                                  <SelectItem key={dialect} value={dialect}>{dialect}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedLanguages(languages.map(l => l.name))}>
                      {t('common:selectAll')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedLanguages([])}>
                      {t('common:deselectAll')}
                    </Button>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">{t('common:generateTranslations')}</h2>
                  <div className="flex items-center space-x-4 mb-4">
                    <Button onClick={startTranslation} disabled={isTranslating}>
                      {isTranslating ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {t('common:startTranslation')}
                    </Button>
                    <Select value={translationMode} onValueChange={(value: 'file' | 'key') => setTranslationMode(value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Translation Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="file">File by File</SelectItem>
                        <SelectItem value="key">Key by Key</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => setIsAIPreferencesOpen(true)}>
                      <Settings className="mr-2 h-4 w-4" />
                      AI Settings
                    </Button>
                  </div>
                  {translationProgress > 0 && (
                    <div className="mt-4">
                      <Progress value={translationProgress} className="w-full" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        <Trans i18nKey="common:translatingProgress" values={{ progress: translationProgress }}>
                          Translating... {{ progress: translationProgress }}% complete
                        </Trans>
                      </p>
                    </div>
                  )}
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">{t('common:downloadFiles')}</h2>
                  <Button onClick={downloadFiles} disabled={translationProgress < 100}>
                    <Download className="mr-2 h-4 w-4" /> {t('common:downloadZip')}
                  </Button>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">{t('common:translationPreview')}</h2>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                    <code>{previewContent}</code>
                  </pre>
                </section>
              </div>
            )}

            {activeTab === 'projects' && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">{t('common:projectManagement')}</h2>
                <div className="flex space-x-4 mb-4">
                  <Input
                    type="text"
                    placeholder={t('common:projectNamePlaceholder')}
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="flex-grow"
                  />
                  <Button onClick={saveProject}>
                    <Save className="mr-2 h-4 w-4" /> {t('common:saveProject')}
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('name')}</TableHead>
                        <TableHead>{t('files')}</TableHead>
                        <TableHead>{t('languages')}</TableHead>
                        <TableHead>{t('version')}</TableHead>
                        <TableHead>{t('collaborators')}</TableHead>
                        <TableHead>{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell>{project.name}</TableCell>
                          <TableCell>{project.files.join(', ')}</TableCell>
                          <TableCell>{project.selectedLanguages.join(', ')}</TableCell>
                          <TableCell>{project.version}</TableCell>
                          <TableCell>{project.collaborators.map(c => c.name).join(', ')}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => loadProject(project)}>
                              <FolderOpen className="mr-2 h-4 w-4" /> {t('load')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            )}

            {activeTab === 'translationMemory' && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">{t('common:translationMemory')}</h2>
                <div className="mb-4 flex space-x-2">
                  <Button onClick={exportTranslationMemory}>
                    <Download className="mr-2 h-4 w-4" /> Export
                  </Button>
                  <label htmlFor="import-tm" className="cursor-pointer">
                    <Button as="span">
                      <Upload className="mr-2 h-4 w-4" /> Import
                    </Button>
                    <input
                      id="import-tm"
                      type="file"
                      className="hidden"
                      accept=".json"
                      onChange={importTranslationMemory}
                    />
                  </label>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('source')}</TableHead>
                        <TableHead>{t('target')}</TableHead>
                        <TableHead>{t('language')}</TableHead>
                        <TableHead>{t('lastUsed')}</TableHead>
                        <TableHead>{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {translationMemory.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{entry.source}</TableCell>
                          <TableCell>{entry.target}</TableCell>
                          <TableCell>{entry.language}</TableCell>
                          <TableCell>{entry.lastUsed.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            )}

            {activeTab === 'glossary' && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">{t('common:glossary')}</h2>
                <div className="mb-4">
                  <Input placeholder={t('term')} id="glossary-term" className="mb-2" />
                  <Input placeholder={t('definition')} id="glossary-definition" className="mb-2" />
                  <Select>
                    <SelectTrigger className="w-full mb-2">
                      <SelectValue placeholder={t('selectLanguage')} />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder={t('category')} id="glossary-category" className="mb-2" />
                  <Button onClick={() => {
                    const term = (document.getElementById('glossary-term') as HTMLInputElement).value
                    const definition = (document.getElementById('glossary-definition') as HTMLInputElement).value
                    const language = (document.querySelector('.glossary-language select') as HTMLSelectElement).value
                    const category = (document.getElementById('glossary-category') as HTMLInputElement).value
                    if (term && definition && language && category) {
                      addGlossaryEntry(term, definition, language, category)
                    }
                  }}>{t('addEntry')}</Button>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('term')}</TableHead>
                        <TableHead>{t('definition')}</TableHead>
                        <TableHead>{t('language')}</TableHead>
                        <TableHead>{t('category')}</TableHead>
                        <TableHead>{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {glossary.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{entry.term}</TableCell>
                          <TableCell>{entry.definition}</TableCell>
                          <TableCell>{entry.language}</TableCell>
                          <TableCell>{entry.category}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            )}

            {activeTab === 'analytics' && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">{t('common:analytics')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">{t('totalProjects')}</h3>
                    <p className="text-3xl font-bold">{analyticsData.projectCount}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">{t('totalTranslations')}</h3>
                    <p className="text-3xl font-bold">{analyticsData.totalTranslations}</p>
                  </div>
                </div>
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-2">{t('languageUsage')}</h3>
                  <div className="h-64">
                    <Bar
                      data={{
                        labels: Object.keys(analyticsData.languageUsage),
                        datasets: [
                          {
                            label: t('usage'),
                            data: Object.values(analyticsData.languageUsage),
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                </div>
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-2">{t('translationEfficiency')}</h3>
                  <div className="h-64">
                    <Line
                      data={{
                        labels: analyticsData.translationEfficiency.map((_, index) => t('day', { day: index + 1 })),
                        datasets: [
                          {
                            label: t('translationsPerSecond'),
                            data: analyticsData.translationEfficiency,
                            backgroundColor: 'rgba(153, 102, 255, 0.2)',
                            borderColor: 'rgba(153, 102, 255, 1)',
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                </div>
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-2">{t('translationSpeedPerLanguage')}</h3>
                  <div className="h-64">
                    <Bar
                      data={{
                        labels: Object.keys(analyticsData.translationSpeedPerLanguage),
                        datasets: [
                          {
                            label: t('secondsPerTranslation'),
                            data: Object.values(analyticsData.translationSpeedPerLanguage),
                            backgroundColor: 'rgba(255, 159, 64, 0.2)',
                            borderColor: 'rgba(255, 159, 64, 1)',
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('userProductivity')}</h3>
                  <div className="h-64">
                    <Bar
                      data={{
                        labels: Object.keys(analyticsData.userProductivity),
                        datasets: [
                          {
                            label: t('translationsCompleted'),
                            data: Object.values(analyticsData.userProductivity),
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'teamManagement' && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">{t('common:menu.teamManagement')}</h2>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Team Members</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collaborators.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>{member.name}</TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>{member.role}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button variant="outline" size="sm" className="ml-2">Remove</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Invite New Member</h3>
                  <div className="flex space-x-2">
                    <Input placeholder="Email address" />
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="translator">Translator</SelectItem>
                        <SelectItem value="reviewer">Reviewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button>Invite</Button>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'settings' && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">{t('common:menu.settings')}</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">AI Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="ai-provider">AI Provider</Label>
                        <Select value={aiPreferences.provider} onValueChange={(value: 'openai' | 'anthropic') => setAIPreferences({...aiPreferences, provider: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select AI Provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="anthropic">Anthropic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="ai-model">AI Model</Label>
                        <Select value={aiPreferences.model} onValueChange={(value) => setAIPreferences({...aiPreferences, model: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select AI Model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4o-mini">GPT-4o-mini</SelectItem>
                            <SelectItem value="gpt-4">GPT-4</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="temperature">Temperature</Label>
                        <Input
                          id="temperature"
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={aiPreferences.temperature}
                          onChange={(e) => setAIPreferences({...aiPreferences, temperature: parseFloat(e.target.value)})}
                        />
                        <span>{aiPreferences.temperature}</span>
                      </div>
                      <div>
                        <Label htmlFor="max-tokens">Max Tokens</Label>
                        <Input
                          id="max-tokens"
                          type="number"
                          value={aiPreferences.maxTokens}
                          onChange={(e) => setAIPreferences({...aiPreferences, maxTokens: parseInt(e.target.value)})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="top-p">Top P</Label>
                        <Input
                          id="top-p"
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={aiPreferences.topP}
                          onChange={(e) => setAIPreferences({...aiPreferences, topP: parseFloat(e.target.value)})}
                        />
                        <span>{aiPreferences.topP}</span>
                      </div>
                      <div>
                        <Label htmlFor="frequency-penalty">Frequency Penalty</Label>
                        <Input
                          id="frequency-penalty"
                          type="range"
                          min="-2"
                          max="2"
                          step="0.1"
                          value={aiPreferences.frequencyPenalty}
                          onChange={(e) => setAIPreferences({...aiPreferences, frequencyPenalty: parseFloat(e.target.value)})}
                        />
                        <span>{aiPreferences.frequencyPenalty}</span>
                      </div>
                      <div>
                        <Label htmlFor="presence-penalty">Presence Penalty</Label>
                        <Input
                          id="presence-penalty"
                          type="range"
                          min="-2"
                          max="2"
                          step="0.1"
                          value={aiPreferences.presencePenalty}
                          onChange={(e) => setAIPreferences({...aiPreferences, presencePenalty: parseFloat(e.target.value)})}
                        />
                        <span>{aiPreferences.presencePenalty}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'userProfile' && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">User Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={currentUser.name} onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={currentUser.email} onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})} />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={currentUser.role} onValueChange={(value) => setCurrentUser({...currentUser, role: value as 'admin' | 'translator' | 'reviewer'})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="translator">Translator</SelectItem>
                        <SelectItem value="reviewer">Reviewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="mt-4">Save Changes</Button>
              </section>
            )}

          </Suspense>
        </main>
      </div>
      <Suspense fallback={<div>Loading AI preferences...</div>}>
        <Drawer open={isAIPreferencesOpen} onOpenChange={setIsAIPreferencesOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>AI Preferences</DrawerTitle>
              <DrawerDescription>Adjust AI settings for translations</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              <div>
                <Label htmlFor="ai-provider">AI Provider</Label>
                <Select value={aiPreferences.provider} onValueChange={(value: 'openai' | 'anthropic') => setAIPreferences({...aiPreferences, provider: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ai-model">AI Model</Label>
                <Select value={aiPreferences.model} onValueChange={(value) => setAIPreferences({...aiPreferences, model: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">GPT-4o-mini</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={aiPreferences.temperature}
                  onChange={(e) => setAIPreferences({...aiPreferences, temperature: parseFloat(e.target.value)})}
                />
                <span>{aiPreferences.temperature}</span>
              </div>
              <div>
                <Label htmlFor="max-tokens">Max Tokens</Label>
                <Input
                  id="max-tokens"
                  type="number"
                  value={aiPreferences.maxTokens}
                  onChange={(e) => setAIPreferences({...aiPreferences, maxTokens: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="top-p">Top P</Label>
                <Input
                  id="top-p"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={aiPreferences.topP}
                  onChange={(e) => setAIPreferences({...aiPreferences, topP: parseFloat(e.target.value)})}
                />
                <span>{aiPreferences.topP}</span>
              </div>
              <div>
                <Label htmlFor="frequency-penalty">Frequency Penalty</Label>
                <Input
                  id="frequency-penalty"
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={aiPreferences.frequencyPenalty}
                  onChange={(e) => setAIPreferences({...aiPreferences, frequencyPenalty: parseFloat(e.target.value)})}
                />
                <span>{aiPreferences.frequencyPenalty}</span>
              </div>
              <div>
                <Label htmlFor="presence-penalty">Presence Penalty</Label>
                <Input
                  id="presence-penalty"
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={aiPreferences.presencePenalty}
                  onChange={(e) => setAIPreferences({...aiPreferences, presencePenalty: parseFloat(e.target.value)})}
                />
                <span>{aiPreferences.presencePenalty}</span>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </Suspense>
    </ErrorBoundary>
  )
}
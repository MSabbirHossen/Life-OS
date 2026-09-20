import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import api from '../utils/api';
import { DateInput } from '../components/DateInput';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
import { GuidedReflectionModal } from '../components/GuidedReflectionModal';
import {
  BookOpen,
  Plus,
  Sparkles,
  RefreshCw,
  Trash2,
  Edit2,
  Tag,
  Smile,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Heart,
  Lightbulb,
} from 'lucide-react';

const MOOD_OPTIONS = [
  { label: 'Happy', emoji: '😊' },
  { label: 'Productive', emoji: '🚀' },
  { label: 'Calm', emoji: '😌' },
  { label: 'Tired', emoji: '😴' },
  { label: 'Frustrated', emoji: '😤' },
  { label: 'Reflective', emoji: '🤔' },
];

export const Journal = ({ selectedDate }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState(null);
  const [loadingPrompt, setLoadingPrompt] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGuidedModalOpen, setIsGuidedModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form State
  const [formDate, setFormDate] = useState(selectedDate || getFormattedDate());
  const [summary, setSummary] = useState('');
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [highlights, setHighlights] = useState('');
  const [problemsFaced, setProblemsFaced] = useState('');
  const [gratitudeList, setGratitudeList] = useState(['']);
  const [notesForTomorrow, setNotesForTomorrow] = useState('');
  const [promptAnswer, setPromptAnswer] = useState('');
  const [formPromptQuestion, setFormPromptQuestion] = useState('');

  // Fetch Guided Prompt
  const fetchPrompt = async () => {
    setLoadingPrompt(true);
    try {
      const res = await api.get('/journal/prompt');
      setPrompt(res.data);
      if (!editingEntry) {
        setFormPromptQuestion(res.data.question);
      }
    } catch (err) {
      console.error('Failed to fetch journal prompt', err);
    } finally {
      setLoadingPrompt(false);
    }
  };

  // Fetch Journal Entries
  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/journal');
      setEntries(res.data || []);
    } catch (err) {
      console.error('Failed to fetch journal entries', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchPrompt();
  }, [selectedDate]);

  const openCreateModal = () => {
    setEditingEntry(null);
    setFormDate(selectedDate || getFormattedDate());
    setSummary('');
    setSelectedMoods([]);
    setHighlights('');
    setProblemsFaced('');
    setGratitudeList(['']);
    setNotesForTomorrow('');
    setPromptAnswer('');
    setFormPromptQuestion(prompt ? prompt.question : '');
    setIsModalOpen(true);
  };

  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setFormDate(entry.date);
    setSummary(entry.summary || '');
    setSelectedMoods(entry.moods || []);
    setHighlights(entry.highlights || '');
    setProblemsFaced(entry.problemsFaced || '');
    setGratitudeList(entry.gratitude && entry.gratitude.length ? entry.gratitude : ['']);
    setNotesForTomorrow(entry.notesForTomorrow || '');
    setPromptAnswer(entry.promptAnswer || '');
    setFormPromptQuestion(entry.promptQuestion || (prompt ? prompt.question : ''));
    setIsModalOpen(true);
  };

  const handleMoodToggle = (moodLabel) => {
    setSelectedMoods((prev) =>
      prev.includes(moodLabel) ? prev.filter((m) => m !== moodLabel) : [...prev, moodLabel]
    );
  };

  const handleGratitudeChange = (index, value) => {
    const updated = [...gratitudeList];
    updated[index] = value;
    setGratitudeList(updated);
  };

  const addGratitudeItem = () => {
    setGratitudeList([...gratitudeList, '']);
  };

  const removeGratitudeItem = (index) => {
    setGratitudeList(gratitudeList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      date: formDate,
      summary,
      moods: selectedMoods,
      highlights,
      problemsFaced,
      gratitude: gratitudeList.filter((g) => g.trim().length > 0),
      notesForTomorrow,
      promptQuestion: formPromptQuestion,
      promptAnswer,
    };

    try {
      if (editingEntry) {
        await api.put(`/journal/${editingEntry._id}`, payload);
      } else {
        await api.post('/journal', payload);
      }
      setIsModalOpen(false);
      fetchEntries();
    } catch (err) {
      console.error('Failed to save journal entry', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/journal/${deleteId}`);
      setDeleteId(null);
      fetchEntries();
    } catch (err) {
      console.error('Failed to delete entry', err);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category="Daily Reflection"
        title="Journal & Reflection"
        description="Capture your thoughts, mood, daily gratitude, and track recurring tags."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="secondary"
              size="md"
              icon={Sparkles}
              onClick={() => setIsGuidedModalOpen(true)}
            >
              Guided Growth Popup
            </Button>
            <Button variant="gradient" size="md" icon={Plus} onClick={openCreateModal}>
              New Journal Entry
            </Button>
          </div>
        }
      />

      {/* Guided Reflection Hero Card */}
      {prompt && (
        <div className="relative overflow-hidden p-4 sm:p-6 lg:p-7 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 card-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="purple" size="xs" dot>
                  Guided Prompt of the Day
                </Badge>
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                  Category: {prompt.category}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-primary tracking-tight">
                "{prompt.question}"
              </h3>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                loading={loadingPrompt}
                onClick={fetchPrompt}
              >
                New Prompt
              </Button>
              <Button variant="primary" size="sm" icon={Plus} onClick={openCreateModal}>
                Answer Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Entries Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary tracking-tight">Journal Entries</h2>
          <span className="text-xs font-semibold text-secondary">{entries.length} entries recorded</span>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No journal entries yet"
            description="Start documenting your daily reflections, highlights, and gratitude list."
            actionText="Create First Entry"
            onAction={openCreateModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {entries.map((entry) => (
              <Card
                key={entry._id}
                hover
                bottomAction={
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(entry)}
                      className="p-1.5 rounded-lg bg-surface/90 dark:bg-surface/90 backdrop-blur-xs border border-theme/60 text-secondary hover:text-accent hover:border-accent/40 hover:bg-accent/10 shadow-xs transition-all cursor-pointer"
                      title="Edit Entry"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(entry._id)}
                      className="p-1.5 rounded-lg bg-surface/90 dark:bg-surface/90 backdrop-blur-xs border border-theme/60 text-secondary hover:text-rose-600 hover:border-rose-500/40 hover:bg-rose-500/10 shadow-xs transition-all cursor-pointer"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                }
              >
                <div className="space-y-4 pb-2">
                  {/* Top: Date & Moods */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent" />
                      <span className="text-xs font-bold text-primary">
                        {formatDisplayDate(entry.date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {entry.moods?.map((m, idx) => (
                        <Badge key={idx} variant="neutral" size="xs">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  {entry.summary && (
                    <p className="text-sm text-primary font-medium leading-relaxed">{entry.summary}</p>
                  )}

                  {/* Prompt Q&A */}
                  {entry.promptQuestion && entry.promptAnswer && (
                    <div className="p-3 bg-subtle rounded-xl border border-theme text-xs space-y-1">
                      <span className="font-bold text-accent block">"{entry.promptQuestion}"</span>
                      <p className="text-secondary italic">{entry.promptAnswer}</p>
                    </div>
                  )}

                  {/* Highlights / Gratitude Chips */}
                  {entry.gratitude && entry.gratitude.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-500" /> Gratitude
                      </span>
                      <ul className="text-xs text-secondary space-y-1 pl-4 list-disc">
                        {entry.gratitude.map((g, i) => (
                          <li key={i}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Auto Tags */}
                  {entry.autoTags && entry.autoTags.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-2 border-t border-subtle flex-wrap">
                      <Tag className="w-3.5 h-3.5 text-secondary" />
                      {entry.autoTags.map((tag, i) => (
                        <Badge key={i} variant="primary" size="xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
        subtitle={`Recording thoughts for ${formatDisplayDate(formDate)}`}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5 pb-1">
          {/* Date and Moods Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-5">
              <DateInput
                label="Journal Date"
                value={formDate}
                onChange={setFormDate}
                required
              />
            </div>
            <div className="lg:col-span-7">
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Moods (Select all that apply)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 gap-1.5">
                {MOOD_OPTIONS.map((m) => {
                  const selected = selectedMoods.includes(m.label);
                  return (
                    <button
                      type="button"
                      key={m.label}
                      onClick={() => handleMoodToggle(m.label)}
                      className={`px-2 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                        selected
                          ? 'bg-accent text-white border-accent shadow-xs'
                          : 'bg-subtle/50 text-secondary border-theme hover:text-primary hover:bg-subtle'
                      }`}
                    >
                      <span>{m.emoji}</span>
                      <span className="truncate">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Daily Summary */}
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>📝</span> Daily Summary & Thoughts
            </label>
            <textarea
              rows={3}
              placeholder="What happened today? How did you feel?"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="textarea-base text-sm"
            />
          </div>

          {/* Guided Prompt Card */}
          {formPromptQuestion && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-indigo-500/5 border border-indigo-500/25 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2">
                <Badge variant="purple" size="xs">
                  <Sparkles className="w-3 h-3 mr-1 text-purple-500" /> Guided Prompt
                </Badge>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-primary leading-relaxed">
                "{formPromptQuestion}"
              </h4>
              <textarea
                rows={2}
                placeholder="Write your honest reflection here..."
                value={promptAnswer}
                onChange={(e) => setPromptAnswer(e.target.value)}
                className="textarea-base text-sm bg-surface/90 placeholder:text-muted"
              />
            </div>
          )}

          {/* Dual Columns: Highlights & Challenges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span>✨</span> Highlights & Wins
              </label>
              <textarea
                rows={2}
                placeholder="What went exceptionally well today?"
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                className="textarea-base min-h-[75px] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span>⚡</span> Obstacles & Challenges
              </label>
              <textarea
                rows={2}
                placeholder="What problems or friction did you face?"
                value={problemsFaced}
                onChange={(e) => setProblemsFaced(e.target.value)}
                className="textarea-base min-h-[75px] text-sm"
              />
            </div>
          </div>

          {/* Gratitude List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <span>🙏</span> Gratitude List
              </label>
              <button
                type="button"
                onClick={addGratitudeItem}
                className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:text-accent-hover transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Blessing
              </button>
            </div>
            <div className="space-y-2">
              {gratitudeList.map((g, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 text-accent font-bold text-[11px]">
                    #{idx + 1}
                  </div>
                  <input
                    type="text"
                    placeholder={`Thing you appreciate #${idx + 1}...`}
                    value={g}
                    onChange={(e) => handleGratitudeChange(idx, e.target.value)}
                    className="input-base text-sm"
                  />
                  {gratitudeList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGratitudeItem(idx)}
                      className="p-2 text-secondary hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer shrink-0"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes for Tomorrow */}
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>🎯</span> Notes & Focus for Tomorrow
            </label>
            <input
              type="text"
              placeholder="Key focus, intention, or reminder for tomorrow..."
              value={notesForTomorrow}
              onChange={(e) => setNotesForTomorrow(e.target.value)}
              className="input-base text-sm"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme/60 mt-2">
            <Button variant="ghost" size="md" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" size="md">
              {editingEntry ? 'Update Entry' : 'Save Entry'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirm Deletion"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to delete this journal entry? It will be permanently removed.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Guided Reflection Modal */}
      <GuidedReflectionModal
        isOpen={isGuidedModalOpen}
        onClose={() => setIsGuidedModalOpen(false)}
        selectedDate={formDate}
        onSaveSuccess={() => {
          fetchEntries();
          fetchPrompt();
        }}
      />
    </div>
  );
};

export default Journal;

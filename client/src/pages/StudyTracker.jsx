import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import api from '../utils/api';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
import {
  GraduationCap,
  Plus,
  Clock,
  BookOpen,
  Trash2,
  ExternalLink,
  ListTodo,
} from 'lucide-react';

export const StudyTracker = ({ selectedDate }) => {
  const activeDate = selectedDate || getFormattedDate();

  const [sessions, setSessions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [goals, setGoals] = useState([]);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Session Modal State
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [resource, setResource] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [progressPercent, setProgressPercent] = useState(50);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [notes, setNotes] = useState('');
  const [savingSession, setSavingSession] = useState(false);

  // Topic / Backlog Modal State
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [topicSubject, setTopicSubject] = useState('');
  const [topicTitle, setTopicTitle] = useState('');
  const [topicStatus, setTopicStatus] = useState('backlog');
  const [topicTargetDate, setTopicTargetDate] = useState('');
  const [topicGoalId, setTopicGoalId] = useState('');
  const [topicNotes, setTopicNotes] = useState('');
  const [savingTopic, setSavingTopic] = useState(false);

  // Deletion modals
  const [deleteSessionId, setDeleteSessionId] = useState(null);
  const [deleteTopicId, setDeleteTopicId] = useState(null);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [sessionsRes, topicsRes, subjectsRes, goalsRes, habitsRes] = await Promise.all([
        api.get(`/study?date=${activeDate}`),
        api.get('/study/topics'),
        api.get('/study/subjects'),
        api.get('/goals'),
        api.get('/habits'),
      ]);
      setSessions(sessionsRes.data || []);
      setTopics(topicsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setGoals(goalsRes.data || []);
      setHabits(habitsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch study data', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [activeDate]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setSavingSession(true);
    try {
      const res = await api.post('/study', {
        date: activeDate,
        subject: subject.trim(),
        resource: resource.trim(),
        durationMinutes: Number(durationMinutes) || 45,
        progressPercent: Number(progressPercent) || 0,
        goalId: selectedGoalId || undefined,
        habitId: selectedHabitId || undefined,
        notes: notes.trim(),
      });
      setIsSessionModalOpen(false);
      setSubject('');
      setResource('');
      setNotes('');
      if (res.data) setSessions((prev) => [res.data, ...prev]);
      fetchData(false);
    } catch (err) {
      console.error('Failed to log study session', err);
    } finally {
      setSavingSession(false);
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!topicSubject.trim() || !topicTitle.trim()) return;

    setSavingTopic(true);
    try {
      const res = await api.post('/study/topics', {
        subject: topicSubject.trim(),
        title: topicTitle.trim(),
        status: topicStatus,
        targetDate: topicTargetDate || undefined,
        linkedGoalId: topicGoalId || undefined,
        notes: topicNotes.trim(),
      });
      setIsTopicModalOpen(false);
      setTopicSubject('');
      setTopicTitle('');
      setTopicNotes('');
      if (res.data) setTopics((prev) => [res.data, ...prev]);
      fetchData(false);
    } catch (err) {
      console.error('Failed to create study topic', err);
    } finally {
      setSavingTopic(false);
    }
  };

  // Instant 0ms Optimistic Topic Status Switch
  const handleUpdateTopicStatus = async (topicId, newStatus) => {
    setTopics((prev) =>
      prev.map((t) => (t._id === topicId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.put(`/study/topics/${topicId}`, { status: newStatus });
      fetchData(false);
    } catch (err) {
      console.error('Failed to update topic status', err);
      fetchData(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteSessionId) return;
    const targetId = deleteSessionId;
    setDeleteSessionId(null);
    setSessions((prev) => prev.filter((s) => s._id !== targetId));

    try {
      await api.delete(`/study/${targetId}`);
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete study session', err);
      fetchData(false);
    }
  };

  const handleDeleteTopic = async () => {
    if (!deleteTopicId) return;
    const targetId = deleteTopicId;
    setDeleteTopicId(null);
    setTopics((prev) => prev.filter((t) => t._id !== targetId));

    try {
      await api.delete(`/study/topics/${targetId}`);
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete study topic', err);
      fetchData(false);
    }
  };

  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const completedTopics = topics.filter((t) => t.status === 'completed').length;

  const formatExternalUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category="Learning & Mastery"
        title="Study & Topic Planning"
        description={`Log deep focus study sessions, plan backlogs chapter by chapter, and link to goals for ${formatDisplayDate(activeDate)}`}
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="md"
              icon={ListTodo}
              onClick={() => setIsTopicModalOpen(true)}
            >
              Plan Topic / Chapter
            </Button>
            <Button
              variant="gradient"
              size="md"
              icon={Plus}
              onClick={() => setIsSessionModalOpen(true)}
            >
              Log Session
            </Button>
          </div>
        }
      />

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard
          title="Study Time Today"
          value={`${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`}
          subtitle={`${sessions.length} sessions completed`}
          icon={Clock}
          color="indigo"
        />
        <StatCard
          title="Backlog Clearance"
          value={`${completedTopics} / ${topics.length}`}
          subtitle="Topics & chapters mastered"
          icon={GraduationCap}
          color="purple"
        />
        <StatCard
          title="Active Curriculum"
          value={subjects.length}
          subtitle="Distinct study subjects"
          icon={BookOpen}
          color="emerald"
        />
      </div>

      {/* Chapter & Topic Backlog Planning Section */}
      <Card
        hover
        title="Chapter & Topic Backlog Planning"
        subtitle="Manage chapter syllabus and eliminate study backlogs"
        icon={ListTodo}
        action={
          <Button variant="outline" size="sm" icon={Plus} onClick={() => setIsTopicModalOpen(true)}>
            Add Chapter / Topic
          </Button>
        }
      >
        {topics.length === 0 ? (
          <div className="p-6 text-center text-xs text-secondary italic bg-subtle/50 rounded-xl border border-dashed border-theme mt-2">
            No chapter topics planned yet. Click "Add Chapter / Topic" to organize your curriculum and eliminate backlogs.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-3">
            {topics.map((top) => {
              const statusColors = {
                backlog: 'warning',
                in_progress: 'primary',
                completed: 'success',
              };

              return (
                <div
                  key={top._id}
                  className="p-4 rounded-2xl bg-subtle border border-theme flex flex-col justify-between space-y-3 transition-all duration-200"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="purple" size="xs">
                        {top.subject}
                      </Badge>
                      <Badge variant={statusColors[top.status] || 'neutral'} size="xs" dot>
                        {top.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-primary tracking-tight">{top.title}</h4>
                    {top.notes && <p className="text-xs text-secondary font-medium">{top.notes}</p>}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-theme/50 gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateTopicStatus(top._id, 'backlog')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-150 ${
                          top.status === 'backlog'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-surface text-secondary hover:text-primary'
                        }`}
                      >
                        Backlog
                      </button>
                      <button
                        onClick={() => handleUpdateTopicStatus(top._id, 'in_progress')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-150 ${
                          top.status === 'in_progress'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-surface text-secondary hover:text-primary'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => handleUpdateTopicStatus(top._id, 'completed')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-150 ${
                          top.status === 'completed'
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-surface text-secondary hover:text-primary'
                        }`}
                      >
                        Done
                      </button>
                    </div>

                    <button
                      onClick={() => setDeleteTopicId(top._id)}
                      className="p-1 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                      title="Delete Topic"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Study Sessions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary tracking-tight">Today's Study Sessions</h2>
          <span className="text-xs font-semibold text-secondary">{sessions.length} sessions</span>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No study sessions logged today"
            description="Log your study session to track duration, completion percentage, and resource materials."
            actionText="Log Study Session"
            onAction={() => setIsSessionModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {sessions.map((sess) => (
              <Card
                key={sess._id}
                hover
                action={
                  <button
                    onClick={() => setDeleteSessionId(sess._id)}
                    className="p-1.5 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                }
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="purple" size="sm" dot>
                      {sess.subject}
                    </Badge>
                    <span className="text-xs font-extrabold text-accent">
                      {Math.floor(sess.durationMinutes / 60)}h {sess.durationMinutes % 60}m
                    </span>
                  </div>

                  {/* External Resource Link */}
                  {sess.resource && (
                    <div className="flex items-center gap-1.5 text-xs text-secondary font-medium">
                      <a
                        href={formatExternalUrl(sess.resource)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-accent hover:underline font-bold truncate max-w-full"
                        title="Open Resource Material"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{sess.resource}</span>
                      </a>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-secondary">
                      <span>Completion</span>
                      <span className="text-primary">{sess.progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-subtle rounded-full overflow-hidden border border-theme">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${sess.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {sess.notes && (
                    <p className="text-xs text-secondary font-medium leading-relaxed bg-subtle p-2.5 rounded-xl border border-theme">
                      {sess.notes}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Log Session Modal */}
      <Modal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        title="Log Study Session"
        subtitle={`Record focus session for ${formatDisplayDate(activeDate)}`}
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Subject / Topic
            </label>
            <input
              type="text"
              required
              placeholder="e.g. System Design, Algorithms, Physics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input-base"
              list="subject-suggestions"
            />
            <datalist id="subject-suggestions">
              {subjects.map((sub, idx) => (
                <option key={idx} value={sub} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Resource Link / Material URL
            </label>
            <input
              type="text"
              placeholder="e.g. https://coursera.org/learn/react, docs.nestjs.com"
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="1"
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Progress ({progressPercent}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={progressPercent}
                onChange={(e) => setProgressPercent(e.target.value)}
                className="w-full accent-indigo-600 mt-2 cursor-pointer"
              />
            </div>
          </div>

          {/* Goal Linkage Dropdown */}
          {goals.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Link to Goal (Optional)
              </label>
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="select-base"
              >
                <option value="">None (Independent Study)</option>
                {goals.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Notes & Key Takeaways (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="What core ideas did you learn?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="textarea-base"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsSessionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingSession}>
              Save Session
            </Button>
          </div>
        </form>
      </Modal>

      {/* Plan Topic Modal */}
      <Modal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        title="Plan Chapter / Topic Backlog"
        subtitle="Organize syllabus and clear study backlogs"
      >
        <form onSubmit={handleCreateTopic} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Subject Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Systems, Calculus"
              value={topicSubject}
              onChange={(e) => setTopicSubject(e.target.value)}
              className="input-base"
              list="topic-subject-suggestions"
            />
            <datalist id="topic-subject-suggestions">
              {subjects.map((sub, idx) => (
                <option key={idx} value={sub} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Topic / Chapter Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Chapter 5: Raft Consensus Algorithm"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Initial Status
              </label>
              <select
                value={topicStatus}
                onChange={(e) => setTopicStatus(e.target.value)}
                className="select-base"
              >
                <option value="backlog">Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Target Date (Optional)
              </label>
              <input
                type="date"
                value={topicTargetDate}
                onChange={(e) => setTopicTargetDate(e.target.value)}
                className="input-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Focus on video exercises and summary notes"
              value={topicNotes}
              onChange={(e) => setTopicNotes(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsTopicModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingTopic}>
              Save Topic
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Session Confirmation Modal */}
      <Modal
        isOpen={!!deleteSessionId}
        onClose={() => setDeleteSessionId(null)}
        title="Confirm Deletion"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to delete this study session? It will be permanently removed.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteSessionId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteSession}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Topic Confirmation Modal */}
      <Modal
        isOpen={!!deleteTopicId}
        onClose={() => setDeleteTopicId(null)}
        title="Confirm Deletion"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to delete this planned chapter topic?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteTopicId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteTopic}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudyTracker;

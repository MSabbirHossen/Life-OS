import { StudySession } from '../models/StudySession.js';
import { StudyTopic } from '../models/StudyTopic.js';

export const getStudySessions = async (req, res) => {
  try {
    const { date, from, to } = req.query;
    const filter = { userId: req.user._id };

    if (date) {
      filter.date = date;
    } else if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const sessions = await StudySession.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch study sessions' });
  }
};

export const createStudySession = async (req, res) => {
  try {
    const { date, subject, resource, durationMinutes, progressPercent, goalId, habitId, notes } = req.body;
    if (!date || !subject || !durationMinutes) {
      return res.status(400).json({ message: 'Date, subject, and duration are required' });
    }

    const session = await StudySession.create({
      userId: req.user._id,
      date,
      subject: subject.trim(),
      resource: resource?.trim() || '',
      durationMinutes: Number(durationMinutes),
      progressPercent: Number(progressPercent) || 0,
      goalId: goalId || undefined,
      habitId: habitId || undefined,
      notes: notes?.trim() || '',
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to log study session' });
  }
};

export const getSubjects = async (req, res) => {
  try {
    const { q } = req.query;
    const filter = { userId: req.user._id };
    if (q) {
      filter.subject = { $regex: q, $options: 'i' };
    }

    const sessionSubjects = await StudySession.distinct('subject', filter);
    const topicSubjects = await StudyTopic.distinct('subject', filter);
    const combined = Array.from(new Set([...sessionSubjects, ...topicSubjects]));
    res.json(combined);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch subjects' });
  }
};

export const deleteStudySession = async (req, res) => {
  try {
    const session = await StudySession.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ message: 'Study session not found' });
    res.json({ message: 'Study session deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete session' });
  }
};

// --- Study Backlog / Topics Endpoints ---

export const getStudyTopics = async (req, res) => {
  try {
    const { subject, status } = req.query;
    const filter = { userId: req.user._id };
    if (subject && subject !== 'all') filter.subject = subject;
    if (status && status !== 'all') filter.status = status;

    const topics = await StudyTopic.find(filter).sort({ createdAt: -1 });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch study topics' });
  }
};

export const createStudyTopic = async (req, res) => {
  try {
    const { subject, title, status, targetDate, linkedGoalId, notes } = req.body;
    if (!subject || !title) {
      return res.status(400).json({ message: 'Subject and topic/chapter title are required' });
    }

    const topic = await StudyTopic.create({
      userId: req.user._id,
      subject: subject.trim(),
      title: title.trim(),
      status: status || 'backlog',
      targetDate: targetDate || '',
      linkedGoalId: linkedGoalId || undefined,
      notes: notes?.trim() || '',
    });

    res.status(201).json(topic);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create study topic' });
  }
};

export const updateStudyTopic = async (req, res) => {
  try {
    const topic = await StudyTopic.findOne({ _id: req.params.id, userId: req.user._id });
    if (!topic) return res.status(404).json({ message: 'Study topic not found' });

    const { subject, title, status, targetDate, linkedGoalId, notes } = req.body;
    if (subject) topic.subject = subject.trim();
    if (title) topic.title = title.trim();
    if (status) topic.status = status;
    if (targetDate !== undefined) topic.targetDate = targetDate;
    if (linkedGoalId !== undefined) topic.linkedGoalId = linkedGoalId || undefined;
    if (notes !== undefined) topic.notes = notes.trim();

    await topic.save();
    res.json(topic);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update study topic' });
  }
};

export const deleteStudyTopic = async (req, res) => {
  try {
    const topic = await StudyTopic.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!topic) return res.status(404).json({ message: 'Study topic not found' });
    res.json({ message: 'Study topic deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete study topic' });
  }
};

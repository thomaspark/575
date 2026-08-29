import type { ScheduledCronJob, ScheduledJob } from '@devvit/scheduler';
import { createServer, context, getServerPort } from '@devvit/server';
import { redis } from '@devvit/redis';
import { reddit } from '@devvit/reddit';
import { scheduler } from '@devvit/scheduler';
import express from 'express';

import { pickWords } from '../shared/words.js';
import allWords from '../../data/words.json' with { type: 'json' };

const DAILY_TASK_NAME = 'daily_post';
const FALLBACK_TEXT = 'This post contains content not supported by old Reddit.';

const app = express();
app.use(express.json());

const wordsKey = (postId: string) => `words_${postId}`;

/** Board for a post, generated once at creation and cached in redis thereafter. */
async function boardFor(postId: string) {
  const cached = await redis.get(wordsKey(postId));

  if (cached) {
    return JSON.parse(cached);
  }

  const board = pickWords(allWords);
  await redis.set(wordsKey(postId), JSON.stringify(board));

  return board;
}

async function createGamePost() {
  const subreddit = await reddit.getCurrentSubreddit();
  const d = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const post = await reddit.submitCustomPost({
    title: `575: ${d}`,
    subredditName: subreddit.name,
    textFallback: { text: FALLBACK_TEXT },
  });

  // Fix the board at creation so two players opening a fresh post cannot each
  // generate their own and race to store it.
  await redis.set(wordsKey(post.id), JSON.stringify(pickWords(allWords)));

  return post;
}

async function cancelDailyTasks(): Promise<number> {
  const jobs = await scheduler.listJobs();
  const daily = jobs.filter((job: ScheduledJob | ScheduledCronJob) => job.name === DAILY_TASK_NAME);

  for (const job of daily) {
    await scheduler.cancelJob(job.id);
  }

  return daily.length;
}

app.post('/api/init', async (_req, res) => {
  const { postId } = context;

  if (!postId) {
    res.status(400).json({ error: 'No post context.' });
    return;
  }

  const [words, username] = await Promise.all([
    boardFor(postId),
    reddit.getCurrentUsername(),
  ]);

  res.json({ words, username: username ?? 'anon' });
});

app.post('/api/submit', async (req, res) => {
  const { postId } = context;

  if (!postId) {
    res.status(400).json({ error: 'No post context.' });
    return;
  }

  const poem = req.body?.poem;

  if (typeof poem !== 'string' || poem.length === 0) {
    res.status(400).json({ error: 'Missing poem.' });
    return;
  }

  const username = await reddit.getCurrentUsername();
  const author = username
    ? `[${username}](https://reddit.com/user/${username}/)`
    : 'anon';

  try {
    await reddit.submitComment({ id: postId, text: `${poem}\n\n– ${author}` });
    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to submit poem', e);
    res.status(500).json({ ok: false, error: 'Could not post your poem.' });
  }
});

app.post('/internal/menu/create-post', async (_req, res) => {
  const post = await createGamePost();
  res.json({ navigateTo: post.url, showToast: 'Created post.' });
});

app.post('/internal/menu/enable-daily', async (_req, res) => {
  await cancelDailyTasks();
  await scheduler.runJob({ name: DAILY_TASK_NAME, cron: '0 0 * * *' });
  res.json({ showToast: 'Enabled daily post.' });
});

app.post('/internal/menu/disable-daily', async (_req, res) => {
  const cancelled = await cancelDailyTasks();
  res.json({
    showToast: cancelled > 0 ? 'Disabled daily post.' : 'No daily post was scheduled.',
  });
});

app.post('/internal/cron/daily-post', async (_req, res) => {
  await createGamePost();
  res.json({ ok: true });
});

createServer(app).listen(getServerPort());

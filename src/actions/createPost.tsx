import { Devvit } from '@devvit/public-api';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

Devvit.addMenuItem({
  label: 'Create New 575 Game',
  location: 'subreddit',
  onPress: async function(_event, context) {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const d = new Date().toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'});

    const post = await reddit.submitPost({
      title: `575: ${d}`,
      subredditName: subreddit.name,
      textFallback: { text: `This post contains content not supported by old Reddit.` },
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">Loading 575...</text>
        </vstack>
      ),
    });

    await post.setTextFallback({ text: `This post contains content not supported by old Reddit. [Click here to view the full post.](${post})` });
    ui.showToast({ text: 'Created post.' });
    ui.navigateTo(post);
  }
});

Devvit.addSchedulerJob({
  name: 'daily_thread',
  onRun: async function(_event, context) {
    const { reddit } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const d = new Date().toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'});

    const post = await reddit.submitPost({
      title: `575: ${d}`,
      subredditName: subreddit.name,
      textFallback: { text: `This post contains content not supported by old Reddit.` },
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">Loading 575...</text>
        </vstack>
      ),
    });

    await post.setTextFallback({ text: `This post contains content not supported by old Reddit. [Click here to view the full post.](${post})` });
  }
});

Devvit.addMenuItem({
  label: 'Enable daily post',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    try {
      const oldJobId = (await context.redis.get('jobId')) || '0';
      await context.scheduler.cancelJob(oldJobId);
      context.ui.showToast({ text: 'Disabled daily post.' });

      const jobId = await context.scheduler.runJob({
        name: 'daily_thread',
        cron: '0 0 * * *',
      });

      await context.redis.set('jobId', jobId);
      context.ui.showToast({ text: 'Enabled daily post.' });
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
});

Devvit.addMenuItem({
  label: 'Disable daily post',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const jobId = (await context.redis.get('jobId')) || '0';
    await context.scheduler.cancelJob(jobId);
    context.ui.showToast({ text: 'Disabled daily post.' });
  },
});


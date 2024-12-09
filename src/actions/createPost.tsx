import { Devvit } from '@devvit/public-api';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

Devvit.addMenuItem({
  label: 'Create New Magnetry Post',
  location: 'subreddit',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const d = new Date().toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'});

    const post = await reddit.submitPost({
      title: `Magnetry: ${d}`,
      subredditName: subreddit.name,
      textFallback: { text: `This post contains content not supported by old Reddit. [Click here to view the full post.](${post})` },
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">loading...</text>
        </vstack>
      ),
    });
    ui.showToast({ text: 'Created post!' });
    ui.navigateTo(post);
  },
});

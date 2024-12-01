import { Devvit } from '@devvit/public-api';
// import { pickWords } from './utils/utils.js';
// import allWords from '../data/words.json';

// Configure Devvit's plugins 
Devvit.configure({
  redditAPI: true,
  redis: true,
});

// Adds a new menu item to the subreddit allowing to create a new post
Devvit.addMenuItem({
  label: 'Create New Magnetry Post',
  location: 'subreddit',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();

    const post = await reddit.submitPost({
      title: 'Magnetry: 2024-11-30',
      subredditName: subreddit.name,
      // The preview appears while the post loads
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">Loading  ...{context.postId}</text>
        </vstack>
      ),
    });
    // const words = pickWords(allWords);
    // await context.redis.set(`words_${post}`, JSON.stringify(words));
    // console.log(post);
    ui.showToast({ text: 'Created post!' });
    ui.navigateTo(post);
  },
});

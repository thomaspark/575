// Learn more at developers.reddit.com/docs
import { Devvit, useState } from '@devvit/public-api';
import words from '../data/words.json';

Devvit.configure({
  redditAPI: true,
});

function shuffle(arr) {
  return arr.sort(() => 0.5 - Math.random());
}

let magnets = [];
magnets.push(...words.always);
magnets.push(...shuffle(words.adjectives).slice(0, 15));
magnets.push(...shuffle(words.prepositions).slice(0, 10));
magnets.push(...shuffle(words.pronouns).slice(0, 10));
magnets.push(...shuffle(words.verbs).slice(0, 15));
magnets.push(...shuffle(words.nouns).slice(0, 15));
magnets.sort();

console.log(magnets);

// Add a menu item to the subreddit menu for instantiating the new experience post
Devvit.addMenuItem({
  label: 'Add Magnetry Post',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const date = new Date().toLocaleDateString('en-CA');
    await reddit.submitPost({
      title: `Magnetry ${date}`,
      subredditName: subreddit.name,
      // The preview appears while the post loads
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">Loading ...</text>
        </vstack>
      ),
    });
    ui.showToast({ text: 'Created post!' });
  },
});

// Add a post type definition
Devvit.addCustomPostType({
  name: 'Experience Post',
  height: 'regular',
  render: (_context) => {
    const [counter, setCounter] = useState(0);

    return (
      <vstack height="100%" width="100%" gap="medium" alignment="center middle">
        <image
          url="logo.png"
          description="logo"
          imageHeight={256}
          imageWidth={256}
          height="48px"
          width="48px"
        />
        <hstack height="100%" width="100%" gap="medium" alignment="center middle">
          {magnets.map(magnet => <button key={magnet} name={magnet} size="small">{magnet}</button>)}
        </hstack>
        <text size="large">{`Click Counter: ${counter}`}</text>
        <button appearance="primary" onPress={() => setCounter((counter) => counter + 1)}>
          Click me!
        </button>
      </vstack>
    );
  },
});

export default Devvit;

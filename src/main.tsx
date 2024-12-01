import { Devvit } from '@devvit/public-api';
import './actions/createPost.js';
import { App } from './components/App.js';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

Devvit.addCustomPostType({
  name: 'Magnetry',
  description: 'Magnetic Poetry!',
  height: 'tall',
  render: App
});

// Devvit.addTrigger({
//   event: 'PostCreate', // Event name from above
//   onEvent: async (event) => {
//     console.log(`Received OnPostSubmit event:\n${JSON.stringify(event)}`);
//   },
// });

export default Devvit;

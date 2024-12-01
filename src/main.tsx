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

export default Devvit;

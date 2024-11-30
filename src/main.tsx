import './createPost.js';

import { App } from './components/App.js';
import { Devvit, useState } from '@devvit/public-api';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

Devvit.addCustomPostType({
  name: 'Webview Example',
  height: 'tall',
  render: App
});

export default Devvit;

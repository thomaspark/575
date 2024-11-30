import './createPost.js';
import allWords from '../data/words.json';

import { Devvit, useState } from '@devvit/public-api';

// Defines the messages that are exchanged between Devvit and Web View
type WebViewMessage =
  | {
      type: 'initialData';
      data: { username: string; currentCounter: number; words: array };
    }
  | {
      type: 'setCounter';
      data: { newCounter: number; words: array };
    }
  | {
      type: 'updateCounter';
      data: { currentCounter: number };
    };

Devvit.configure({
  redditAPI: true,
  redis: true,
});

function shuffle(arr) {
  return arr.sort(() => 0.5 - Math.random());
}

function getMagnets(words) {
  let magnets = [];
  magnets.push(...words.always);
  magnets.push(...shuffle(words.adjectives).slice(0, 15));
  magnets.push(...shuffle(words.prepositions).slice(0, 10));
  magnets.push(...shuffle(words.pronouns).slice(0, 10));
  magnets.push(...shuffle(words.verbs).slice(0, 15));
  magnets.push(...shuffle(words.nouns).slice(0, 15));

  return magnets.sort();
}


// Add a custom post type to Devvit
Devvit.addCustomPostType({
  name: 'Webview Example',
  height: 'tall',
  render: (context) => {
    // Load username with `useAsync` hook
    const [username] = useState(async () => {
      const currUser = await context.reddit.getCurrentUser();
      return currUser?.username ?? 'anon';
    });

    // Load latest counter from redis with `useAsync` hook
    const [counter, setCounter] = useState(async () => {
      const redisCount = await context.redis.get(`counter_${context.postId}`);
      return Number(redisCount ?? 0);
    });

    const [words, setWords] = useState(async () => {
      const redisWords = await context.redis.get(`words_${context.postId}`);
      return redisWords ?? getMagnets(allWords);
    });

    // Create a reactive state for web view visibility
    // const [webviewVisible, setWebviewVisible] = useState(false);

    // When the web view invokes `window.parent.postMessage` this function is called
    const onMessage = async (msg: WebViewMessage) => {
      switch (msg.type) {
        case 'setCounter':
          await context.redis.set(`counter_${context.postId}`, msg.data.newCounter.toString());
          context.ui.webView.postMessage('myWebView', {
            type: 'updateCounter',
            data: {
              currentCounter: msg.data.newCounter,
            },
          });
          setCounter(msg.data.newCounter);
          break;
        case 'initialData':
        case 'updateCounter':
          break;

        default:
          throw new Error(`Unknown message type: ${msg satisfies never}`);
      }
    };

    // When the button is clicked, send initial data to web view and show it
    // const onShowWebviewClick = () => {
    //   setWebviewVisible(true);
    //   context.ui.webView.postMessage('myWebView', {
    //     type: 'initialData',
    //     data: {
    //       username: username,
    //       currentCounter: counter,
    //     },
    //   });
    // };

    // Render the custom post type
    return (
      <vstack border="thick" borderColor="black" height="100%">
        <webview
          id="myWebView"
          url="page.html"
          onMessage={(msg) => onMessage(msg as WebViewMessage)}
          grow
          height="100%"
        />
      </vstack>
    );
  },
});

export default Devvit;

import { Devvit, useState } from '@devvit/public-api';
import { pickWords } from '../utils/utils.js';
import allWords from '../../data/words.json';

export const App = (context: Devvit.Context): JSX.Element => {
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

  const [username] = useState(async () => {
    const currUser = await context.reddit.getCurrentUser();
    return currUser?.username ?? 'anon';
  });

  const [counter, setCounter] = useState(async () => {
    const redisCount = await context.redis.get(`counter_${context.postId}`);
    return Number(redisCount ?? 0);
  });

  const [words, setWords] = useState(async () => {
    const redisWords = await context.redis.get(`words_${context.postId}`);

    if (redisWords) {
      return JSON.parse(redisWords);
    } else {
      let magnets = pickWords(allWords);
      await context.redis.set(`words_${context.postId}`, JSON.stringify(magnets));

      return magnets;
    }
  });

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
        context.ui.webView.postMessage('myWebView', {
          type: 'initialData',
          data: {
            username: username,
            currentCounter: counter,
            words: words
          },
        });
        break;
      case 'updateCounter':
        break;

      default:
        throw new Error(`Unknown message type: ${msg satisfies never}`);
    }
  };

  return (
    <vstack large height="100%">
      <webview
        id="myWebView"
        url="page.html"
        onMessage={(msg) => onMessage(msg as WebViewMessage)}
        grow
        height="100%"
      />
    </vstack>
  );

};

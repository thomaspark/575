import { Devvit, useState } from '@devvit/public-api';
import { pickWords } from '../utils/utils.js';
import allWords from '../../data/words.json';

export const App = (context: Devvit.Context): JSX.Element => {
  type WebViewMessage =
    | {
        type: 'INIT';
        data: { };
      }
    | {
        type: 'SUBMIT';
        data: { poem: string };
      };

  const [username] = useState(async () => {
    const currUser = await context.reddit.getCurrentUser();
    return currUser?.username ?? 'anon';
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
      case 'INIT':
        context.ui.webView.postMessage('myWebView', {
          type: 'initialData',
          data: {
            words: words,
            username: username
          },
        });
        break;
      case 'SUBMIT':
        const author = username === 'anon' ? 'anon' : `[${username}](https://reddit.com/user/${username}/)`;
        const poem = msg.data.poem + `\n\n– ${author}`;
        const comment = await context.reddit.submitComment({
          id: context.postId, 
          text: poem,
        });

        context.ui.showToast('Poem submitted.');
        // context.ui.navigateTo(comment);
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

class App {
  constructor() {
    const output = document.querySelector('#messageOutput');
    const increaseButton = document.querySelector('#btn-increase');
    const decreaseButton = document.querySelector('#btn-decrease');
    const usernameLabel = document.querySelector('#username');
    const counterLabel = document.querySelector('#counter');
    const poem = document.querySelector('#poem');
    const lines = document.querySelectorAll('#poem .line');
    const title = document.querySelector('#title');
    const submit = document.querySelector('#submit');

    const syllables = [5, 7, 5];
    let line = 0;
    var counter = 0;

    const updateSubmit = () => {
      if (title.value.length > 0 && syllables.every(s => s === 0)) {
        submit.disabled = false;
      } else {
        submit.disabled = true;
      }
    }

    const updateSyllables = (syllables) => {
      syllables.forEach((s, i) => {
        let line = poem.querySelector(`.line:nth-child(${i+1}) .syllables`);
        line.innerText = s;
      });

      updateSubmit();
      updateWords();
    };

    const updateLine = (target) => {
      let syllables = poem.querySelectorAll('.syllables');
      syllables.forEach((s) => {
        s.classList.remove('active');
      });

      let active = target.closest('.line').querySelector('.syllables');
      active.classList.add('active');
      line = active.getAttribute('data-line');
    };

    const updateWords = (e) => {
      let words = document.querySelectorAll('#words .magnet');
      let syllablesLeft = syllables[line];

      words.forEach(word => {
        let s = word.getAttribute('syllables');

        if (s > syllablesLeft) {
          word.classList.add('disabled');
        } else {
          word.classList.remove('disabled');
        }
      });
    };

    const clickWord = (e) => {
      let magnet = e.target;
      let s = magnet.getAttribute('syllables');

      if (syllables[line] - s >= 0) {
        syllables[line] = Math.max(syllables[line] - parseInt(s), 0);

        let container = [...lines][line].querySelector('.magnets');
        let clone = magnet.cloneNode(true);
        clone.addEventListener('click', (e) => {
          updateLine(e.target);
          let s = e.target.getAttribute('syllables');
          syllables[line] += parseInt(s);
          updateSyllables(syllables);
          e.target.remove();
        });
        container.appendChild(clone);
        updateSyllables(syllables);
      }
    };

    const clickLine = (e) => {
      updateLine(e.target);
      updateWords();
    };

    const loadWords = (words) => {
      let magnets = document.querySelector('#words');

      words.forEach((obj, i) => {
        let magnet = document.createElement('span');
        magnet.classList.add('magnet');
        magnet.innerText = obj.word;

        if (Array.from(obj.word)[0] == '-') {
          magnet.setAttribute('suffix', true);
        }

        magnet.setAttribute('word', obj.word);
        magnet.setAttribute('syllables', obj.syllables);
        magnet.addEventListener('click', clickWord);
        magnets.appendChild(magnet);
      });

      updateWords();
    };

    const formatPoem = () => {
      let poem = '';

      poem += `> **${title.value}**\n>\n`;

      poem += [...lines].reduce((acc, curr) => {
        let magnets = curr.querySelectorAll('.magnet');
        let text = '> ';
        text += [...magnets].map((magnet, i) => {
          let word = magnet.getAttribute('word');

          if (magnet.getAttribute('suffix')) {
            word = word.substring(1);
          }

          if (i === 0 || magnet.getAttribute('suffix')) {
            return word;
          } else {
            return ' ' + word;
          }
        }).join('');
        text += '\n\n';

        return acc + text;
      }, '');

      return poem;
    }

    window.addEventListener('load', (ev) => {
      window.parent?.postMessage(
        { type: 'INIT', data: { } },
        '*'
      );
    });

    // When the Devvit app sends a message with `context.ui.webView.postMessage`, this will be triggered
    window.addEventListener('message', (ev) => {
      const { type, data } = ev.data;

      // Reserved type for messages sent via `context.ui.webView.postMessage`
      if (type === 'devvit-message') {
        const { message } = data;

        // Always output full message
        output.replaceChildren(JSON.stringify(message, undefined, 2));

        // Load initial data
        if (message.type === 'initialData') {
          const { username, currentCounter } = message.data;
          usernameLabel.innerText = username;
          counterLabel.innerText = counter = currentCounter;
          // console.log(message.data.words);

          loadWords(message.data.words);

          document.body.classList.remove('hide');

          let syllables = poem.querySelectorAll('.syllables');
          syllables.forEach(s => {
            s.addEventListener('click', clickLine);
          });
        }

        // Update counter
        if (message.type === 'updateCounter') {
          const { currentCounter } = message.data;
          counterLabel.innerText = counter = currentCounter;
        }
      }
    });

    title.addEventListener('keyup', (e) => {
      updateSubmit();
    });

    submit.addEventListener('click', (e) => {
      e.target.disabled = true;
      
      window.parent?.postMessage(
        { type: 'SUBMIT', data: { poem: formatPoem() } },
        '*'
      );
    });

    increaseButton.addEventListener('click', () => {
      // Sends a message to the Devvit app
      window.parent?.postMessage(
        { type: 'setCounter', data: { newCounter: Number(counter + 1) } },
        '*'
      );
    });

    decreaseButton.addEventListener('click', () => {
      // Sends a message to the Devvit app
      window.parent?.postMessage(
        { type: 'setCounter', data: { newCounter: Number(counter - 1) } },
        '*'
      );
    });
  }
}

new App();

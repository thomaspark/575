class App {
  constructor() {
    const output = document.querySelector('#messageOutput');
    const increaseButton = document.querySelector('#btn-increase');
    const decreaseButton = document.querySelector('#btn-decrease');
    const usernameLabel = document.querySelector('#username');
    const counterLabel = document.querySelector('#counter');
    const poem = document.querySelector('#poem');
    const lines = document.querySelectorAll('#poem .line');

    const syllables = [5, 7, 5];
    let line = 0;
    var counter = 0;

    const updateSyllables = (syllables) => {
      syllables.forEach((s, i) => {
        let line = poem.querySelector(`.line:nth-child(${i+1}) .syllables`);
        line.innerText = s;
      });

      disableWords();
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

    const clickWord = (e) => {
      let magnet = e.target;
      let s = magnet.getAttribute('syllables');

      if (syllables[line] - s >= 0) {
        syllables[line] -= parseInt(s);

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
      disableWords();
    };

    const disableWords = (e) => {
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

    window.addEventListener('load', (ev) => {
      window.parent?.postMessage(
        { type: 'initialData', data: { } },
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
          console.log(message.data.words);

          let magnets = document.querySelector('#words');

          message.data.words.forEach((obj, i) => {
            let magnet = document.createElement('span');
            magnet.classList.add('magnet');
            magnet.innerText = obj.word;
            magnet.setAttribute('word', obj.word);
            magnet.setAttribute('syllables', obj.syllables);
            magnet.addEventListener('click', clickWord);
            magnets.appendChild(magnet);
          });

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

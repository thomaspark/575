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
      syllables.forEach((syllable, i) => {
        poem.querySelector(`:nth-child(${i+1})`).innerText(syllable);
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

          let magnets = document.querySelector('#magnets');

          message.data.words.forEach(word => {
            let magnet = document.createElement('span');
            magnet.classList.add('magnet');
            magnet.innerText = word;
            magnet.addEventListener('click', (e) => {
              let target = [...lines][line].querySelector('.magnets');
              let clone = e.target.cloneNode(true);
              clone.addEventListener('click', (e) => {
                console.log('remove', e.target);
                e.target.remove();
              });
              target.appendChild(clone);
            });
            magnets.appendChild(magnet);
          });

          document.body.classList.remove('hide');
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

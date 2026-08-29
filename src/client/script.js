class App {
  constructor() {
    const poem = document.querySelector('#poem');
    const lines = document.querySelectorAll('#poem .line');
    const title = document.querySelector('#title');
    const submit = document.querySelector('#submit');
    const helpBtn = document.querySelector('#help-btn');
    const help = document.querySelector('#help');
    const status = document.querySelector('#status');

    const syllables = [5, 7, 5];
    let line = 0;
    let submitting = false;
    let magnetIndex = [];

    const TITLE_MAX = 100;

    // The title is interpolated into a markdown blockquote inside a bold span,
    // so collapse it to one line and escape anything that could close either.
    const cleanTitle = () => title.value
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, TITLE_MAX)
      .replace(/([\\`*_\[\]~])/g, '\\$1');

    const updateSubmit = () => {
      if (!submitting && title.value.trim().length > 0 && syllables.every(s => s === 0)) {
        submit.disabled = false;
      } else {
        submit.disabled = true;
      }
    }

    const updateSyllables = () => {
      syllables.forEach((s, i) => {
        let marker = poem.querySelector(`.line:nth-child(${i+1}) .syllables`);
        marker.setAttribute('value', s);

        if (s === 0) {
          marker.innerText = '✓';

          if (marker.classList.contains('active')) {
            marker.classList.add('blink');
            setTimeout(() => {
              marker.classList.remove('blink');
            }, 150);
          }
        } else {
          marker.innerText = s;
        }
      });

      updateSubmit();
      updateWords();
      updateUsed();
    };

    const updateLine = (target) => {
      let markers = poem.querySelectorAll('.syllables');
      markers.forEach((marker) => {
        marker.classList.remove('active');
      });

      let active = target.closest('.line').querySelector('.syllables');
      active.classList.add('active');
      line = parseInt(active.getAttribute('data-line'), 10);
    };

    // Words currently standing in the poem are marked in the bank, so it is
    // obvious at a glance what has been used. Clearing the last copy of a word
    // out of the poem unmarks it.
    const updateUsed = () => {
      let used = new Set(
        [...poem.querySelectorAll('.magnet')].map((m) => m.getAttribute('word'))
      );

      magnetIndex.forEach(({ el }) => {
        el.classList.toggle('used', used.has(el.getAttribute('word')));
      });
    };

    const updateWords = () => {
      let syllablesLeft = syllables[line];

      magnetIndex.forEach(({ el, count }) => {
        let disabled = count > syllablesLeft;

        el.classList.toggle('disabled', disabled);
        el.setAttribute('aria-disabled', disabled);
        el.setAttribute('tabindex', disabled ? '-1' : '0');
      });
    };

    // Called only when a placement takes a line to zero. Prefers the next
    // unfinished line, wrapping so lines left short earlier are not skipped;
    // once nothing is left to fill, the title is the only thing still needed.
    const advance = () => {
      for (let i = 1; i <= syllables.length; i++) {
        let next = (line + i) % syllables.length;

        if (syllables[next] > 0) {
          updateLine(poem.querySelector(`.line:nth-child(${next + 1}) .syllables`));
          updateWords();
          return;
        }
      }

      title.focus();
    };

    const clickWord = (e) => {
      let magnet = e.target.closest('.magnet');

      if (!magnet) {
        return;
      }

      let s = magnet.getAttribute('syllables');
      let container = [...lines][line].querySelector('.magnets');

      // A suffix modifies the word before it, so it needs one to attach to.
      // Without this, a zero-syllable suffix passes the check below on any
      // line, including an empty one, where it would render as a bare stem.
      if (magnet.getAttribute('suffix') && !container.querySelector('.magnet')) {
        return;
      }

      if (syllables[line] - s >= 0) {
        let before = syllables[line];
        syllables[line] = Math.max(syllables[line] - parseInt(s), 0);

        let clone = magnet.cloneNode(true);
        clone.title = 'Remove';
        clone.setAttribute('tabindex', '0');
        clone.setAttribute('aria-disabled', 'false');
        clone.classList.add('blink');
        setTimeout(() => {
          clone.classList.remove('blink');
        }, 150);
        container.appendChild(clone);
        updateSyllables();

        // Only on the transition to zero, so adding a suffix to an already
        // finished line leaves you on that line to keep editing it.
        if (before > 0 && syllables[line] === 0) {
          advance();
        }
      }
    };

    const removeWord = (e) => {
      let magnet = e.target.closest('.magnets .magnet');

      if (!magnet) {
        return;
      }

      updateLine(magnet);
      syllables[line] += parseInt(magnet.getAttribute('syllables'));
      // Removed before the recount so the word it carried is no longer seen
      // standing in the poem.
      magnet.remove();
      updateSyllables();
    };

    const clickLine = (e) => {
      updateLine(e.target);
      updateWords();
    };

    const loadWords = (words) => {
      let magnets = document.querySelector('#words');
      let fragment = document.createDocumentFragment();

      words.forEach((obj, i) => {
        let magnet = document.createElement('span');
        magnet.classList.add('magnet');
        magnet.innerText = obj.word;

        if (obj.word.startsWith('-')) {
          magnet.setAttribute('suffix', true);
        }

        magnet.setAttribute('word', obj.word);
        magnet.setAttribute('syllables', obj.syllables);
        magnet.title = 'Add';
        magnet.setAttribute('role', 'button');
        magnet.setAttribute('tabindex', '0');
        fragment.appendChild(magnet);
        magnetIndex.push({ el: magnet, count: obj.syllables });
      });

      magnets.appendChild(fragment);
      updateWords();
    };

    const formatPoem = () => {
      let poem = '';

      poem += `> **${cleanTitle()}**\n> \n`;

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
        text += '\n> \n';

        return acc + text;
      }, '');

      return poem;
    }

    const setStatus = (text, isError) => {
      status.innerText = text;
      status.classList.toggle('error', Boolean(isError));
    };

    const init = async () => {
      try {
        const res = await fetch('/api/init', { method: 'POST' });

        if (!res.ok) {
          throw new Error(`init failed: ${res.status}`);
        }

        const { words } = await res.json();
        loadWords(words);
        document.body.classList.remove('hide');
      } catch (e) {
        console.error(e);
        setStatus('Could not load today\'s words. Refresh to try again.', true);
        document.body.classList.remove('hide');
      }
    };

    init();

    document.body.addEventListener('click', (e) => {
      if (e.target.id !== 'help-btn') {
        help.classList.add('hide');
      }
    });

    helpBtn.addEventListener('click', (e) => {
      help.classList.toggle('hide');
    });

    helpBtn.addEventListener('keydown', (e) => {
      if (isActivation(e)) {
        e.preventDefault();
        help.classList.toggle('hide');
      }
    });

    const isActivation = (e) => e.key === 'Enter' || e.key === ' ';

    document.querySelector('#words').addEventListener('click', clickWord);
    document.querySelector('#words').addEventListener('keydown', (e) => {
      if (isActivation(e) && e.target.closest('.magnet')) {
        e.preventDefault();
        clickWord(e);
      }
    });

    poem.addEventListener('click', removeWord);
    poem.addEventListener('keydown', (e) => {
      if (!isActivation(e)) {
        return;
      }

      if (e.target.closest('.magnets .magnet')) {
        e.preventDefault();
        removeWord(e);
      } else if (e.target.closest('.syllables')) {
        e.preventDefault();
        clickLine(e);
      }
    });

    poem.querySelectorAll('.syllables, .shadow').forEach(s => {
      s.addEventListener('click', clickLine);
    });

    title.addEventListener('input', (e) => {
      updateSubmit();
    });

    submit.addEventListener('click', async (e) => {
      if (submitting) {
        return;
      }

      submitting = true;
      updateSubmit();
      setStatus('Posting\u2026');

      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ poem: formatPoem() }),
        });

        if (!res.ok) {
          throw new Error(`submit failed: ${res.status}`);
        }

        // Stays latched on success so the same haiku cannot be posted twice.
        setStatus('Poem submitted.');
      } catch (e) {
        console.error(e);
        submitting = false;
        updateSubmit();
        setStatus('Could not post your poem. Please try again.', true);
      }
    });
  }
}

new App();

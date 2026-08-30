class App {
  constructor() {
    const poem = document.querySelector('#poem');
    const board = document.querySelector('.board');
    const lines = document.querySelectorAll('#poem .line');
    const title = document.querySelector('#title');
    const submit = document.querySelector('#submit');
    const reset = document.querySelector('#reset');
    const helpBtn = document.querySelector('#help-btn');
    const help = document.querySelector('#help');
    const status = document.querySelector('#status');

    const syllables = [5, 7, 5];
    // syllables counts down as words land, so the pattern is kept separately
    // to work out how full each line is.
    const TOTALS = [5, 7, 5];
    let line = 0;
    let submitting = false;
    let magnetIndex = [];

    // What each marker is currently showing, and whether the poem was already
    // finished, so the counters and the board only animate on an actual change.
    let shown = [-1, -1, -1];
    let finished = false;

    // How long a cleared poem can be taken back. Long enough to notice the
    // board has gone, short enough that the offer is not still sitting there
    // when you have started again.
    const UNDO_MS = 6000;

    // Matches the opacity transition on #reset.
    const FADE_MS = 400;

    let undo = null;
    let undoTimer = null;
    let fadeTimer = null;

    const TITLE_MAX = 100;
    // How long a magnet takes to shrink away; matches the `lift` keyframe.
    const REMOVE_MS = 180;

    // The title is interpolated into a markdown blockquote inside a bold span,
    // so collapse it to one line and escape anything that could close either.
    const cleanTitle = () => title.value
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, TITLE_MAX)
      .replace(/([\\`*_\[\]~])/g, '\\$1');

    // Restarts a one-shot animation even when the class is already there, so a
    // second change in a row still reads as a second change. The pending
    // cleanup is cancelled first, or it would strip the class out from under
    // the restart it just triggered.
    const replay = (el, name, ms) => {
      clearTimeout(el[`_${name}`]);
      el.classList.remove(name);
      void el.offsetWidth;
      el.classList.add(name);
      el[`_${name}`] = setTimeout(() => el.classList.remove(name), ms);
    };

    const updateSubmit = () => {
      let was = submit.disabled;

      if (!submitting && title.value.trim().length > 0 && syllables.every(s => s === 0)) {
        submit.disabled = false;
      } else {
        submit.disabled = true;
      }

      // The moment the poem becomes postable, the button says so once.
      if (was && !submit.disabled) {
        replay(submit, 'ready', 500);
      }
    }

    const updateSyllables = () => {
      syllables.forEach((s, i) => {
        let row = poem.querySelector(`.line:nth-child(${i+1})`);
        let marker = row.querySelector('.syllables');
        marker.setAttribute('value', s);
        marker.innerText = s === 0 ? '✓' : s;

        // Drives the width of the line's rail.
        row.style.setProperty('--fill', (TOTALS[i] - s) / TOTALS[i]);

        // A count landing on a new number ticks; a line closing gets the
        // bigger settle, since that is the moment worth noticing.
        if (shown[i] !== s) {
          replay(marker, s === 0 ? 'done' : 'tick', 450);
          shown[i] = s;
        }
      });

      updateBoard();
      updateSubmit();
      updateWords();
      updateUsed();
      updateReset();
    };

    // The board takes a bow when the last line closes, markers first, and
    // keeps its lit border for as long as the haiku stands.
    const updateBoard = () => {
      let complete = syllables.every(s => s === 0);

      if (complete && !finished) {
        board.classList.add('finished');
        replay(board, 'pop', 500);
        poem.querySelectorAll('.syllables').forEach((marker) => {
          replay(marker, 'cheer', 700);
        });
      } else if (!complete) {
        board.classList.remove('finished');
      }

      finished = complete;
    };

    const updateLine = (target) => {
      let markers = poem.querySelectorAll('.syllables');
      markers.forEach((marker) => {
        marker.classList.remove('active');
      });

      let active = target.closest('.line').querySelector('.syllables');
      let next = parseInt(active.getAttribute('data-line'), 10);
      active.classList.add('active');

      // Only a real change of line rings, so editing in place stays quiet.
      if (next !== line) {
        replay(active, 'picked', 500);
      }

      line = next;
    };

    // Words currently standing in the poem are marked in the bank, so it is
    // obvious at a glance what has been used. Clearing the last copy of a word
    // out of the poem unmarks it.
    const updateUsed = () => {
      let used = new Set(
        [...poem.querySelectorAll('.magnet:not(.removing)')].map((m) => m.getAttribute('word'))
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
      if (magnet.getAttribute('suffix') && !container.querySelector('.magnet:not(.removing)')) {
        return;
      }

      if (syllables[line] - s >= 0) {
        let before = syllables[line];
        syllables[line] = Math.max(syllables[line] - parseInt(s), 0);

        let clone = magnet.cloneNode(true);
        clone.title = 'Remove';
        clone.setAttribute('tabindex', '0');
        clone.setAttribute('aria-disabled', 'false');
        clone.style.removeProperty('--deal-delay');
        container.appendChild(clone);
        // Keeps the word that was just placed in view on a line long enough
        // to scroll sideways.
        container.scrollLeft = container.scrollWidth;
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

      if (!magnet || magnet.classList.contains('removing')) {
        return;
      }

      updateLine(magnet);
      syllables[line] += parseInt(magnet.getAttribute('syllables'));

      // Marked removing before the recount so the word it carried stops
      // counting as standing in the poem while it shrinks away, and so a
      // second click cannot give its syllables back twice.
      magnet.classList.add('removing');
      magnet.setAttribute('tabindex', '-1');
      magnet.setAttribute('aria-hidden', 'true');
      setTimeout(() => magnet.remove(), REMOVE_MS);

      updateSyllables();
    };

    const clickLine = (e) => {
      updateLine(e.target);
      updateWords();
    };

    /* Clearing ------------------------------------------------------------
       A cleared poem is recoverable rather than guarded: the board goes
       immediately, and the control becomes the way back for a few seconds.
       Cheaper than a confirmation for something you can rebuild in a minute,
       and safer than nothing for something you cannot. */

    const written = () =>
      Boolean(poem.querySelector('.magnet:not(.removing)')) || title.value.trim().length > 0;

    const showReset = () => {
      clearTimeout(fadeTimer);
      reset.classList.remove('fading');
      reset.hidden = false;
    };

    const hideReset = (done) => {
      if (reset.hidden) {
        if (done) {
          done();
        }

        return;
      }

      clearTimeout(fadeTimer);
      reset.classList.add('fading');

      fadeTimer = setTimeout(() => {
        reset.hidden = true;
        reset.classList.remove('fading');

        if (done) {
          done();
        }
      }, FADE_MS);
    };

    // The visible word is only half the label: on its own, a button whose
    // text flips from Clear to Undo says nothing about what happened. The
    // spoken name carries that, and keeps the visible word inside itself so
    // the button still answers to what it says.
    const setResetLabel = (mode) => {
      let undoing = mode === 'undo';

      reset.textContent = undoing ? 'Undo' : 'Clear';
      reset.setAttribute('aria-label', undoing ? 'Undo clearing the poem' : 'Clear the poem');
      reset.classList.toggle('undo', undoing);
    };

    const updateReset = () => {
      // Building again answers the question the undo was asking, so the offer
      // lapses the moment a word goes back on the board.
      if (undo && poem.querySelector('.magnet:not(.removing)')) {
        disarmUndo();
        return;
      }

      if (undo || written()) {
        showReset();
      } else {
        hideReset();
      }
    };

    // lapsed: the window ran out on its own rather than the offer being
    // spent or overtaken. It fades out still reading Undo, and only takes
    // its old label back once it is out of sight — relabelling first would
    // flash the word Clear on the way out.
    const disarmUndo = (lapsed) => {
      clearTimeout(undoTimer);
      undo = null;

      if (lapsed && !written()) {
        hideReset(() => setResetLabel('clear'));
        return;
      }

      setResetLabel('clear');
      updateReset();
    };

    const clearPoem = () => {
      // The board is kept as it stood, not as a description of itself, so
      // putting it back cannot get the order or the syllables wrong.
      undo = {
        rows: [...lines].map((row) =>
          [...row.querySelectorAll('.magnet:not(.removing)')].map((m) => {
            let copy = m.cloneNode(true);
            copy.classList.remove('placeholder', 'landed');
            return copy;
          })
        ),
        title: title.value,
        line,
      };

      [...lines].forEach((row) => {
        row.querySelectorAll('.magnet').forEach((m) => m.remove());
      });

      title.value = '';
      updateLine(poem.querySelector('.line:nth-child(1) .syllables'));
      recount();
      updateSyllables();

      setResetLabel('undo');
      showReset();
      clearTimeout(undoTimer);
      undoTimer = setTimeout(() => disarmUndo(true), UNDO_MS);
    };

    const restorePoem = () => {
      let was = undo;

      was.rows.forEach((words, i) => {
        let container = [...lines][i].querySelector('.magnets');
        words.forEach((m) => container.appendChild(m));
      });

      title.value = was.title;
      updateLine(poem.querySelector(`.line:nth-child(${was.line + 1}) .syllables`));
      recount();
      updateSyllables();
      disarmUndo();
    };

    reset.addEventListener('click', () => {
      if (undo) {
        restorePoem();
      } else {
        clearPoem();
      }
    });

    /* Dragging ------------------------------------------------------------
       Words can be carried as well as clicked: out of the bank onto any line,
       from one line to another, along a line to reorder it, or off the poem
       to drop the word. Clicking and the keyboard are untouched — a press
       only becomes a drag once it moves. */

    // How far a press travels before it counts as a drag rather than a click.
    const DRAG_SLOP = 4;
    // On touch the bank scrolls under your finger, so a word has to be held
    // before it will lift. The same bargain a phone home screen makes.
    const HOLD_MS = 350;

    let press = null;
    let drag = null;

    const cost = (el) => parseInt(el.getAttribute('syllables'), 10) || 0;

    // Counts are read back off the board rather than adjusted by hand, so a
    // word moving between lines cannot leave a stale total behind.
    const recount = () => {
      [...lines].forEach((row, i) => {
        let used = [...row.querySelectorAll('.magnet:not(.removing)')]
          .reduce((sum, m) => sum + cost(m), 0);

        syllables[i] = Math.max(TOTALS[i] - used, 0);
      });
    };

    // What a line would hold with this word on it. The word is discounted
    // where it already stands, so shuffling within one line is always free.
    const fits = (row, el) => {
      let used = [...row.querySelectorAll('.magnet:not(.removing)')]
        .filter((m) => m !== el)
        .reduce((sum, m) => sum + cost(m), 0);

      return used + cost(el) <= TOTALS[[...lines].indexOf(row)];
    };

    // Where the carried word would land: the word it goes in front of, and
    // the place it would take. The carried word is left out of the reckoning,
    // so its own current position never counts as a neighbour.
    const landing = (container, x, el) => {
      let items = [...container.querySelectorAll('.magnet:not(.removing)')]
        .filter((m) => m !== el);

      let before = items.find((m) => {
        let r = m.getBoundingClientRect();
        return x < r.left + r.width / 2;
      }) || null;

      return { before, index: before ? items.indexOf(before) : items.length };
    };

    const blockScroll = (e) => e.preventDefault();

    const moveGhost = (x, y) => {
      drag.ghost.style.transform =
        `translate(${x - drag.dx}px, ${y - drag.dy}px) scale(1.06) rotate(-2deg)`;
    };

    const startDrag = (x, y) => {
      let source = press.el;
      let fromBank = Boolean(source.closest('#words'));
      let el;

      if (fromBank) {
        // The bank keeps its words, so a copy travels. It is the real word
        // from the start, just marked as not yet landed.
        el = source.cloneNode(true);
        el.title = 'Remove';
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-disabled', 'false');
        el.classList.remove('used', 'disabled');
        el.style.removeProperty('--deal-delay');
      } else {
        el = source;
      }

      el.classList.add('placeholder');

      let ghost = source.cloneNode(true);
      ghost.classList.add('ghost');
      ghost.classList.remove('placeholder', 'used', 'disabled');
      ghost.removeAttribute('tabindex');
      document.body.appendChild(ghost);

      let r = source.getBoundingClientRect();

      drag = {
        el,
        ghost,
        fromBank,
        // Where a carried word goes back to if the drag is called off.
        home: fromBank ? null : { parent: source.parentNode, next: source.nextSibling },
        dx: press.x - r.left,
        dy: press.y - r.top,
        landed: !fromBank,
      };

      document.body.classList.add('dragging');
      document.addEventListener('touchmove', blockScroll, { passive: false });
      updateDrag(x, y);
    };

    const updateDrag = (x, y) => {
      moveGhost(x, y);

      let under = document.elementFromPoint(x, y);
      let row = under && under.closest('#poem .line');
      let ok = false;

      if (row && fits(row, drag.el)) {
        let container = row.querySelector('.magnets');
        let spot = landing(container, x, drag.el);

        // A suffix modifies the word before it, so it can never come first.
        if (!(drag.el.getAttribute('suffix') && spot.index === 0)) {
          container.insertBefore(drag.el, spot.before);
          ok = true;
        }
      }

      if (!ok && drag.landed) {
        drag.el.remove();
      }

      drag.landed = ok;

      [...lines].forEach((l) => l.classList.toggle('over', ok && l === row));
      drag.ghost.classList.toggle('reject', Boolean(row) && !ok);
      // Carrying a word clear of the poem drops it, said in the language the
      // poem already uses for removal.
      drag.ghost.classList.toggle('discard', !drag.fromBank && !row);
    };

    const endDrag = (commit) => {
      document.body.classList.remove('dragging');
      document.removeEventListener('touchmove', blockScroll);
      [...lines].forEach((l) => l.classList.remove('over'));
      drag.ghost.remove();

      if (!commit) {
        if (drag.fromBank) {
          drag.el.remove();
        } else if (drag.home.parent.isConnected) {
          drag.home.parent.insertBefore(drag.el, drag.home.next);
        }

        drag.el.classList.remove('placeholder');
        drag = null;
        return;
      }

      if (drag.landed) {
        let row = drag.el.closest('.line');
        let i = [...lines].indexOf(row);
        let before = syllables[i];

        drag.el.classList.remove('placeholder');
        replay(drag.el, 'landed', 350);
        updateLine(drag.el);
        recount();
        updateSyllables();

        // Same as a clicked word: only the transition to zero moves you on.
        if (before > 0 && syllables[i] === 0) {
          advance();
        }
      } else {
        // Nothing landed. A bank word simply never arrived; a word carried
        // out of the poem is already gone from it.
        drag.el.remove();
        recount();
        updateSyllables();
      }

      drag = null;
    };

    // A press that became a drag must not also read as a click on whatever
    // it was let go over — that would remove the word just dropped.
    const swallowClick = () => {
      let swallow = (e) => {
        e.stopPropagation();
        e.preventDefault();
      };

      document.addEventListener('click', swallow, true);
      setTimeout(() => document.removeEventListener('click', swallow, true), 0);
    };

    document.addEventListener('pointerdown', (e) => {
      if (drag || press || e.button !== 0) {
        return;
      }

      let magnet = e.target.closest('.magnet');

      if (!magnet || magnet.classList.contains('removing')) {
        return;
      }

      // Only the bank and the poem hold words worth carrying.
      if (!magnet.closest('#words') && !magnet.closest('#poem .magnets')) {
        return;
      }

      press = { el: magnet, id: e.pointerId, x: e.clientX, y: e.clientY,
                touch: e.pointerType === 'touch' };

      if (press.touch) {
        press.timer = setTimeout(() => startDrag(press.x, press.y), HOLD_MS);
      }
    });

    document.addEventListener('pointermove', (e) => {
      if (drag) {
        updateDrag(e.clientX, e.clientY);
        return;
      }

      if (!press || e.pointerId !== press.id) {
        return;
      }

      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < DRAG_SLOP) {
        return;
      }

      if (press.touch) {
        // Moving before the hold is up is a scroll, not a pick-up.
        clearTimeout(press.timer);
        press = null;
        return;
      }

      startDrag(e.clientX, e.clientY);
    });

    document.addEventListener('pointerup', (e) => {
      if (press && press.timer) {
        clearTimeout(press.timer);
      }

      press = null;

      if (drag) {
        endDrag(true);
        swallowClick();
      }
    });

    document.addEventListener('pointercancel', () => {
      if (press && press.timer) {
        clearTimeout(press.timer);
      }

      press = null;

      if (drag) {
        endDrag(false);
        swallowClick();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drag) {
        endDrag(false);
        swallowClick();
      }
    });

    // How many sizes down the tiles will go before the bank gives up and
    // scrolls. Each step is defined in the stylesheet.
    const FIT_STEPS = 3;

    // The day's words are not a fixed height: a board of long words needs
    // more rows than a board of short ones, and the post is the same size
    // either way. So the tiles are sized to the room available, largest
    // first, rather than the last row being left under a scroll.
    const fitWords = () => {
      let bank = document.querySelector('#words');

      for (let step = 0; step <= FIT_STEPS; step++) {
        if (step === 0) {
          bank.removeAttribute('data-fit');
        } else {
          bank.setAttribute('data-fit', step);
        }

        if (bank.scrollHeight <= bank.clientHeight) {
          return;
        }
      }
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
        // The bank deals itself out in a short cascade. Capped, so a full
        // board still finishes landing in half a second.
        magnet.style.setProperty('--deal-delay', `${Math.min(i * 10, 500)}ms`);
        fragment.appendChild(magnet);
        magnetIndex.push({ el: magnet, count: obj.syllables });
      });

      magnets.appendChild(fragment);
      updateWords();
      fitWords();
    };

    const formatPoem = () => {
      let poem = '';

      poem += `> **${cleanTitle()}**\n> \n`;

      poem += [...lines].reduce((acc, curr) => {
        let magnets = curr.querySelectorAll('.magnet:not(.removing)');
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

    // One handler for the whole poem: a word is a word, and everything else
    // on a line — the badge, the run of space after the last word, the caret
    // slot on an empty line — picks that line up.
    poem.addEventListener('click', (e) => {
      if (e.target.closest('.magnets .magnet')) {
        removeWord(e);
      } else if (e.target.closest('.line')) {
        clickLine(e);
      }
    });

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

    // A post can be resized around the game, and the room for words with it.
    let fitTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(fitTimer);
      fitTimer = setTimeout(fitWords, 150);
    });

    title.addEventListener('input', (e) => {
      updateSubmit();
      updateReset();
    });

    submit.addEventListener('click', async (e) => {
      if (submitting) {
        return;
      }

      submitting = true;
      updateSubmit();
      setStatus('Posting…');

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
        document.body.classList.add('posted');
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

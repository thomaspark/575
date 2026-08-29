# The 575 Game

## Overview

Create a poem in the 5-7-5 haiku format using the words of the day. The words change daily!

## How to play

1. Create a 5-7-5 haiku poem.
2. Add a word to your poem by clicking a word of the day.
3. Remove a word from your poem by clicking it.
4. Line markers show how many syllables remain.
5. Activate a line by clicking its line marker.
6. When your poem is finished, give it a title and share it!

Words and line markers are also reachable by keyboard: Tab to move, Enter
or Space to place, remove, or switch lines.

## Development

    npm install
    npm run playtest      # plays to r/575game

    npm run check         # typecheck server and shared code
    npm run build         # bundle the server to dist/server

Layout:

    devvit.json    app config: post entrypoint, server, menu, scheduler
    src/client/    the game, uploaded as static assets
    src/server/    express server behind @devvit/web/server
    src/shared/    word picking, used by the server
    data/          the word list

## Changelog

0.1.0 Migrate from Blocks to Devvit Web; fix word sampling bias, duplicate
      words, duplicate submissions, suffix placement, the clipped submit
      button, and two dropped CSS rules; add keyboard support
0.0.9 Increase rarity of long words
0.0.8 Add common adverbs
0.0.7 Cancel old daily job before scheduling new job
0.0.1 Initial version

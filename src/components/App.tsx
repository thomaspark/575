import { Devvit, useState } from '@devvit/public-api';

export const App = (context: Devvit.Context): JSX.Element => {

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

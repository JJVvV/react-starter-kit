/*! React Starter Kit | MIT License | http://www.reactstarterkit.com/ */

require('source-map-support').install();

import 'babel/polyfill';
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import express from 'express';
import React from 'react';
import './core/Dispatcher';
import './stores/AppStore';
import db from './core/Database';
import App from './components/App';

const server = express();

server.set('port', (process.env.PORT || 5000));
server.use(express.static(path.join(__dirname)));

//
// Register API middleware
// -----------------------------------------------------------------------------
require('./api/query')(server);

//
// Register server-side rendering middleware
// -----------------------------------------------------------------------------

// The top-level React component + HTML template for it
const templateFile = path.join(__dirname, 'templates/index.html');
const template = _.template(fs.readFileSync(templateFile, 'utf8'));

server.get('*', async (req, res, next) => {
  try {
    let uri = req.path;
    let notFound = false;
    let css = [];
    let data = {description: ''};
    let app = <App
      path={req.path}
      context={{
        onInsertCss: value => css.push(value),
        onSetTitle: value => data.title = value,
        onSetMeta: (key, value) => data[key] = value,
        onPageNotFound: () => notFound = true
      }} />;

    await db.getPage(uri);
    data.body = React.renderToString(app);
    data.css = css.join('');
    let html = template(data);
    if (notFound) {
      res.status(404);
    }
    res.send(html);
  } catch (err) {
    next(err);
  }
});

//
// Launch the server
// -----------------------------------------------------------------------------

server.listen(server.get('port'), () => {
  if (process.send) {
    process.send('online');
  } else {
    console.log('The server is running at http://localhost:' + server.get('port'));
  }
});

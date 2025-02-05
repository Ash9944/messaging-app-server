import express, { json, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from "cors";
import { connectPromise } from "./dao/mongodbUtil.js"
const app = express();

app.use(logger('dev'));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

import users from './routes/users.js';
import messages from './routes/messages.js';
import groupChat from './routes/groupChats.js';
app.use('/user', users);
app.use('/messages', messages);
app.use('/group', groupChat);

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

await connectPromise()

export default app;

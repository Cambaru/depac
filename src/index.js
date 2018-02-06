import express from 'express';
import {createServer} from 'http';
import socket from 'socket.io';
import path from 'path';
import debug from 'debug';

const d = debug('app');

const app = express();
const server = createServer(app);
const io = socket(server);

app.use(express.static(path.resolve('./public')));
app.use(express.static(path.resolve('./node_modules')));

const port = 3000;

server.listen(port, () => {
  console.log('listening on *:%d', port);
  console.log('Lets get shit going...');
});

const sentmessages = [];
// const img = [];
const users = [];

/**
 * Einzelner Benutzer
 */
class User {
  constructor(sid) {
    this.id = sid;
    this.name = '';
    this.isAdmin = false;
    this.canPing = false;
  }

  makeAdmin() {
    this.isAdmin = true;
    this.canPing = true;
  }

  unmakeAdmin() {
    this.isAdmin = false;
    this.canPing = false;
  }

  enablePing() {
    this.canPing = true;
  }

  disablePing() {
    this.canPing = false;
  }
}

/**
 * Alle Benutzer
 */
const userUtils = {
  getUserById: (id) => {
    return users[userUtils.getIndexById(id)];
  },

  getIndexByName: (name) => {
    let i=0;
    users.forEach((element) => {
      i++;
      if (element.name == name) {
        return i;
      }
    });
    return -1;
  },

  getIndexById: (id) => {
    for (let i = 0; i< users.length; i++) {
      if (users[i].id == id) {
        return i;
      }
    }
    return -1;
  },

  userHasName: (id) => {
    for (let i = 0; i < users.length; i++) {
      if (users[i].id == id) {
        if (users[i].name != '') {
          return true;
        } else {
          return false;
        }
      }
    }
    return false;
  },

  getUserIdByName: (name) => {
    let res;
    users.some((u) => {
      if (u.name === name) {
        res = u.id;
        return true;
      }
    });
    return res;
  },

  getUserNameById: (id) => {
    for (let i = 0; i< users.length; i++) {
      if (users[i].id == id) {
        return users[i].name;
      }
    }
    return false;
  },

  isNameTaken: (name) => {
    let res = false;
    users.forEach((u) => {
      if (u.name.toLowerCase() == name.toLowerCase()) {
        res = true;
        return true;
      }
    });
    return res;
  },
};

const srv = 'server message';

io.on('connection', (socket) => {
  // Benutzer Speichern
  users.push(new User(socket.id));
  d('%s connected!', socket.id);

  // Vor dem Connect gesendete Nachrichten nachsenden!
  sentmessages.forEach((element) => {
    socket.emit('chat message', element);
  });

  // Willkommens Nachticht bei Join
  socket.emit(srv, 'Willkommen im Chat!');
  socket.broadcast.emit(srv,'Benutzer verbunden!');
  socket.emit(srv, 'Benutze /help für Hilfe!');
  socket.emit(srv, 'Benutze /name (name) um dir einen Namen zu geben!');

  // Verwalte Chat Nachrichten
  socket.on('chat message', (msg) => {
    d('Incoming Message: %s by %s', msg, socket.id);

    let hasName = false;
    let isAdmin = false;
    
    // User hat name!
    if (userUtils.userHasName(socket.id)) hasName = true;
    // Benutzer ist Admin
    if (userUtils.getUserById(socket.id).isAdmin) isAdmin = true;

    // Kommandos abfangen
    switch (msg.split(' ')[0]) {
    case '/help' || '/hilfe':
      if (isAdmin) {
        socket.emit(srv, 'Admin Tools:');
        socket.emit(srv, 'Benutze /list Admins um alle Admins zu zeigen!');
        socket.emit(srv, 'Benutze /kick (Name) um einen User zu kicken!');
        socket.emit(srv, 'Benutze /ping (Name) um einem User das Pingen zu ermöglichen!');
        socket.emit(srv, 'Benutze /unset Admin um dich selbst als Admin zu entfernen!');
        socket.emit(srv, 'Benutze /rename (name) (newname) um einen Benutzer umzubenennen!');
      }

      if (hasName) {
        socket.emit(srv, 'User Tools:');
        socket.emit(srv, 'Benutze /name (name) um deinen Namen zu setzen!');
      }

      socket.emit(srv, 'Benutze /change name um deinen Namen zu ändern!');
      return;

    case '/name':
      if (userUtils.isNameTaken(msg.split(' ')[1])) {
        socket.emit(srv, 'Dieser Nutzername ist nicht verfügbar!');
        return;
      }

      userUtils.getUserById(socket.id).name = msg.split(' ')[1];

      d('%s set username to %s', socket.id, userUtils.getUserById(socket.id).name);
      socket.emit(srv, 'Du heißt nun ' + userUtils.getUserById(socket.id).name+' !');
      return;
    case '/setAdmin':
      if (hasName){
        users[userUtils.getIndexById(socket.id)].isAdmin = true;
        socket.emit('make admin',true);
        return;
      }  
    case '/unsetAdmin':
      if (hasName){
        users[userUtils.getIndexById(socket.id)].isAdmin = false;
        socket.emit('make admin',false);
        return;
      }  
    case '/frage':
      if(hasName){
        let frage = msg.substring(6,msg.lenght);
        users.forEach(user => {
          if(user.isAdmin){
            io.to(user.id).emit('question','Frage von ' + userUtils.getUserNameById(socket.id)+ ':');
            io.to(user.id).emit('question',frage);
          }
        });
        return;
      }
    case '/kick':
      if(isAdmin){
        let uname = msg.substring(6,msg.lenght);
        console.log(uname);
        if(userUtils.isNameTaken(uname)){
          io.to(userUtils.getUserIdByName(uname)).emit('disco',1);
          users.forEach(user => {
            if(user.isAdmin){
              io.to(user.id).emit('question',userUtils.getUserNameById(socket.id) + " kickte " + uname);
            }
          });
        }
        else{
          socket.emit(srv,'Kick nicht möglich, da es diesen Namen nicht gibt!');
        }
        return;
      }  

    }

    if (msg.charAt(0) === '/') {
      socket.emit(srv, 'Befehl nicht gefunden! Für weitere Hilfe bitte /help benutzen!');
      return;
    }

    if (!hasName) {
      socket.emit(srv, 'Benutze /name (name) um deinen Namen zu setzen!');
      return;
    }

    const message =
      userUtils.getUserNameById(socket.id) +
      ' ' +
      (new Date).toLocaleTimeString() +
      ' : ' +
      msg;

    let event = 'chat message';
    if (isAdmin) event = 'admin message';

    io.emit(event, message);
  });

  // Map Ping
  socket.on('ping map', (ping) => {
    if (userUtils.getUserById(socket.id).isAdmin ||
        userUtils.getUserById(socket.id).canPing) {
      io.emit('ping map', ping);
    }
  });

  socket.on('disconnect', (t) => {
    if(t){
      users.forEach(user => {
        if(user.isAdmin){
          io.to(user.id).emit('question',"Kick Erfolgreich!");
        }
      });
    }
    else{
      d('user disconnected');
      if(userUtils.userHasName(socket.id)){
        socket.broadcast.emit(srv,userUtils.getUserNameById(socket.id) + ' hatt den Raum verlassen!');
      }
      else{
        io.emit(srv, 'Benutzer hatt den Raum verlassen');
      }
    }
      users.splice(userUtils.getIndexById(socket.id),1); 
  });

  socket.on('force disco', function(t){
    socket.disconnect(t);
});
});

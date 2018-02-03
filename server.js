var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
/*app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});*/
app.use(require('express').static(path.join(__dirname, 'public')));
var d = new Date();

//Bereits gesendete Nachrichten
sentmessages = [];

img = [];


//Liste aller Admins
operators = [];

// 2d Array [socketID],[username]
names = [];

//Speichert benutzer die Pingen dürfen
ping = [];

io.on('connection', function(socket){
  console.log('a user connected');

  sentmessages.forEach(element => {
    socket.emit('chat message', element);
  });

  //Willkommens Nachticht bei Join und Broadcast info an alle anderen!
  socket.emit('chat message', "Willkommen im Chat!")
  socket.broadcast.emit('chat message', "Benutzer verbunden!");


  //Verwalte Chat Nachrichten
  socket.on('chat message', function(msg){
    //Prüfe msg auf Inhalt
    if(msg != ""){
      //Ist Message ein Befehl?
      if(msg.charAt(0) == '/'){
        if(operators.indexOf(socket.id)>-1){
          //Admin Tools
          if(msg == "/list Admins"){
            socket.emit('chat message', "There is " + operators.length + " Admins:");
            operators.forEach(element => {
              socket.emit('chat message',"  " + element);
            });       
          }
          if(msg == "/list Admins"){
            socket.emit('chat message', "There is " + operators.length + " Admins:");
            operators.forEach(element => {
              socket.emit('chat message',"  " + element);
            });       
          }



          if(msg == "/help"){
            socket.emit('chat message', "Admin Tools:");      
            socket.emit('chat message', "Benutze /list Admins um alle Admins zu zeigen!");      
            socket.emit('chat message', "Benutze /kick (Name) um einen User zu kicken!");
            socket.emit('chat message', "Benutze /ping (Name) um einem User das Pingen zu ermöglichen!");
            socket.emit('chat message', "Benutze /unset Admin um dich selbst als Admin zu entfernen!");
            socket.emit('chat message', "Benutze /rename (name) (newname) um einen Benutzer umzubenennen!")
            socket.emit('chat message', "User Tools:");     
            socket.emit('chat message', "Benutze /name (name) um deinen Namen zu setzen!");
            socket.emit('chat message', "Benutze /change name um deinen Namen zu ändern!");
          }
        }
        //Socket ist User
        else{
          //Setze Operator über Chat
          if(msg == "/set Admin"){
            operators.push(socket.id);
            console.log("Made " + socket.id + " Operator!");
            socket.emit('chat message', "Du bist nun Operator!");
            socket.emit('make admin', 1);
          }
          if(msg == "/help"){
            socket.emit('chat message', "Benutze /name (name) um deinen Namen zu setzen!");
            socket.emit('chat message', "Benutze /change name um deinen Namen zu ändern!");
          }
        }

        //Befehle für Alle:


        //Namen setzen
        if(msg.indexOf("/name") == 0){
          
          if(!(!!names.find(e => e.id === socket.id))){
            var n = msg.split(" ");         
            names.push({id: socket.id ,name: n[1]});
            socket.emit('chat message', "Du heißt nun "+n[1]);
          }
          //Benutzer hatt bereits namen 
          else{
            socket.emit('chat message', "Du hast bereits einen Namen!");
          }
        }
       

      }
      else{
        //Chatten nur erlaubt wenn Benutzer einen Username hatt!
        if(!!names.find(e => e.id === socket.id)){
          //Normale Chatnachricht
          var username = names.find(e => e.id === socket.id).name;
          var message = username + " " + d.toLocaleTimeString()+ " : " +msg;
          console.log(message);
          io.emit('chat message',message);
          sentmessages.push(message);
        }
        else{
          socket.emit('chat message',"Wähle einen Username mit /name (name) um zu chatten!");
        }
      }             
    }
  });


  //Map Ping
  socket.on('ping map',function(ping){
    if(operators.indexOf(socket.id)>-1 || ping.indexOf(socket.id)>-1){
      console.log(ping);
      io.emit('ping map', ping);
    }
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
    io.emit('chat message', "Benutzer getrennt");

    //Operator Disconnect 
    //Löscht Operator aus Array
    var i = operators.splice(operators.indexOf(socket.id),1);
    if(i==-1)
      console.log("Operator hatt den Raum verlassen!");
  });


});

http.listen(3000, function(){
  console.log('listening on *:3000');
  console.log('Lets get shit going...');
});
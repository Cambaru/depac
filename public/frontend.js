$(document).ready(function() {
  let socket = io();

  // Events

  // Send Chat Message
  $('form').submit(function() {
    socket.emit('chat message', $('#m').val());
    $('#m').val('');
    return false;
  });

  $('#pdf').click(function(e) {
    let arr = [e.pageX, e.pageY];
    socket.emit('ping map', arr);
  });

  $('#button').on('click', function() {
    $('#file-input').trigger('click');
  });

  // Listener
  //
  // Get Message from Server
  socket.on('make admin', function(t) {
    console.log('I get called!');
    $('.tools').css('visibility', 'visible');
  });

  socket.on('chat message', function(msg) {
    $('#messages').append($('<li>').text(msg));
  });

  socket.on('ping map', function(ping) {
    console.log('Hatt geklappt');
    let arr = ping;

    // $('#points').append($('<div id="p"></div>').next().css("top",arr[1]-20).next().css("left",arr[0]-20).next().show().next().css("visibility","visible").next().fadeOut(500));

    $('#p').css('top', arr[1]-20);
    $('#p').css('left', arr[0]-20);
    $('#p').show();
    $('#p').css('visibility', 'visible');
    $('#p').fadeOut(500);
  });
});


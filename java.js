
var knob = $('#knob');
var angle = 0;
var minangle = 0;
var maxangle = 270;
var isDragging = false;
var startAngle = 0;
var startX = 0;
var startY = 0;

function moveKnob(newAngle) {
  if (newAngle >= minangle && newAngle <= maxangle) {
    angle = newAngle;
    setAngle(angle);
  }
}

function setAngle(angle) {
  // rotate knob
  knob.css({
    'transform': 'rotate(' + angle + 'deg)'
  });

  // update % value in text
  var pc = Math.round((angle / 270) * 128);
  $('.current-value').text(pc);
  $("#range-input").val(pc);
}

function getAngle(x, y) {
  var offset = knob.offset();
  var centerX = offset.left + knob.width() / 2;
  var centerY = offset.top + knob.height() / 2;
  var dx = x - centerX;
  var dy = y - centerY;
  var radians = Math.atan2(dy, dx);
  var degrees = radians * (180 / Math.PI);
  return (degrees < 0) ? degrees + 360 : degrees;
}

knob.on('mousedown touchstart', function(e) {
  isDragging = true;
  var pageX = e.pageX || e.originalEvent.touches.pageX;
  var pageY = e.pageY || e.originalEvent.touches.pageY;
  startAngle = getAngle(pageX, pageY) - angle;
  startX = pageX;
  startY = pageY;
  e.preventDefault();
});

$(document).on('mousemove touchmove', function(e) {
  if (isDragging) {
    var pageX = e.pageX || e.originalEvent.touches.pageX;
    var pageY = e.pageY || e.originalEvent.touches.pageY;
    var newAngle = getAngle(pageX, pageY) - startAngle;
    moveKnob(newAngle);
    e.preventDefault();
  }
});

$(document).on('mouseup touchend', function() {
  isDragging = false;
});



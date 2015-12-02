var startX, startY, startValue, target, resolution = 3;

function onMouseDown(e){
  startX = e.pageX;
  startY = e.pageY;
  target = e.target;
  startValue = parseFloat(target.value);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
  document.addEventListener("mouseleave", onMouseUp);
  e.stopImmediatePropagation();
}
function onMouseMove(e){
  var dx = e.pageX - startX;
  var dy = e.pageY - startY;
  target.value = Math.min(target.max,
    Math.max(target.min,
      startValue + (target.step || 1) * ((-dy / resolution) >> 0)
    )
  );
  e.stopImmediatePropagation();
  e.preventDefault();
}

function onMouseUp(e){
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
  document.removeEventListener("mouseleave", onMouseUp);
  target.blur();
}

function applyEffect(node){
  node.addEventListener("mousedown", onMouseDown);
}

module.exports = function(node){
  if (node.length > 0){
    for (var i = 0, endi = node.length; i<endi; i++){
      applyEffect(node[i]);
    }
  } else {
    applyEffect(node);
  }
};
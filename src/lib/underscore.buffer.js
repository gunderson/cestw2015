//requires on undersore

if (_){
  _.mixin({
    "buffer": function(arr, value, maxlength){
      if (arr.length >= maxlength){
        arr.pop();
      }
      arr.unshift(value);
      return arr;
    }
  });
}

var derby = require('derby');
derby.use(require('./ui'));
var app = derby.createApp(module);

app.view.fn('editView', function(item){
  var rowList = [];
  // var level = 0;
  var iterate = function(object, list, level) {
    console.log(typeof object)
    for (var key in object) {
    // Object.keys(object).forEach(function(key){
      if (typeof object[key] === 'object' ) {
        iterate(object[key],list,level+1);
      } else {
        list.push({
          key: key,
          value: object[key],
          level: level,
          type: typeof object[key]
        });        
      };
    }; 
    // }); 
    return list;   
  }
  return iterate(item, rowList, 0);
  return rowList;
})

app.ready(function(model) {


  // model.on('set','dbName',function(path,object){
  // });
  // model.on('set','collectionBox', function(path,obj){
  //   console.log('$');
  //   app.page.render();
  // });
  // model.on('set','collections',function(path,obj){
  //   console.log('!');
  //   app.page.render();
  // });

  app.changeDatabase = function(e, element, next) {
    // console.log('!', element, typeof element); //.find('a').attr('data-value'));
    app.model.set('dbName', $(element).find('a').attr('data-value')); //TODO: e.target.dataset.value
    // console.log(app.model.get('dbName'));
    next();
  };
  app.changeCollection = function (e, element, next){
    //app.model === model YAY!
    app.model.set('collectionName',e.target.dataset.value);
    next();
  }



  app.addKeyValueForm = function(e, element, next){
    $('.key-value-group :last').after($('.key-value-group :last').clone(true, true));
  };
  app.applyFilter = function(e, element, next){  
    var query = {};
    $('.key-value-row').each(function(index,keyValueRow){
      console.log(keyValueRow)
      query[$(keyValueRow).find('.query-key').val()] = $(keyValueRow).find('.query-value').val();
    })
    console.log(query)
    app.page.redirect(window.location.href.substr(0,window.location.href.indexOf('?')) + '?query=' + encodeURI(JSON.stringify(query)));
  };  


  app.showInput = function (e, element, next){
    e.preventDefault();
    $(element).find('div.input').removeClass('hidden');
    $(element).find('span.text').addClass('hidden');
  };
  app.saveInput = function (e, element, next){
    e.preventDefault();
    $(element).parent().parent().find('div.input').addClass('hidden');
    $(element).parent().parent().find('span.text').removeClass('hidden');
  };
  app.cancelInputOnBlur = function (e, element, next){
    e.preventDefault();
    $(element).find('div.input').addClass('hidden');
    $(element).find('span.text').removeClass('hidden');
  };  
  app.cancelInput = function (e, element, next){
    // e.preventDefault();
    $(element).parent().parent().find('div.input').addClass('hidden');
    $(element).parent().parent().find('span.text').removeClass('hidden');
  };  
});


var derby = require('derby');
derby.use(require('./ui'));
derby.use(require('derby-ui-boot'));
var app = derby.createApp(module);



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
      // console.log(keyValueRow)
      query[$(keyValueRow).find('.query-key').val()] = $(keyValueRow).find('.query-value').val();
    })
    // console.log(query)
    app.page.redirect(window.location.href.substr(0,window.location.href.indexOf('?')) + '?query=' + encodeURI(JSON.stringify(query)));
  };  


  app.showInput = function (e, element, next){
    // e.preventDefault();
    $(element).find('div.input').removeClass('hidden').find('input').focus();
    $(element).find('span.text').addClass('hidden');
  };
  app.saveInput = function (e, element, next){    
    // e.preventDefault();
    console.log($(element).parent().find('input').val());//, e.target.dataset.path);
    $(element).parent().parent().find('div.input').addClass('hidden');
    $(element).parent().parent().find('span.text').removeClass('hidden');
  };
  app.cancelInputOnBlur = function (e, element, next){
    // e.preventDefault();
    $(element).find('div.input').addClass('hidden');
    $(element).find('span.text').removeClass('hidden');
  };  
  app.cancelInput = function (e, element, next){
    // e.preventDefault();
    $(element).parent().parent().find('div.input').addClass('hidden');
    $(element).parent().parent().find('span.text').removeClass('hidden');
    // app.page.render();
    // app.page.redirect(window.location.href);
    // next();
    // app.view.history.refresh();
  };  
});


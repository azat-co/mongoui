var derby = require('derby');
derby.use(require('./ui'));
derby.use(require('derby-ui-boot'));


var app = derby.createApp(module);



app.ready(function(model) {

  // console.log(app.page)
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
  };


  app.removeFilterRow = function(e, element, next) {
    $(e.target).parent().parent().remove();
    app.applyFilter();
  };
  app.addKeyValueForm = function(e, element, next){
    $('.key-value-group :last').after($('.key-value-group :last').clone(true, true));
  };
  app.applyFilter = function(e, element, next){  
    var query = {};
    $('.key-value-row').each(function(index,keyValueRow){
      // console.log(keyValueRow)
      if (!$(keyValueRow).find('.query-key').val() || !$(keyValueRow).find('.query-value').val()) return ;
      if ($(keyValueRow).find('.query-value').attr('data-type') === 'ID') {
        query[$(keyValueRow).find('.query-key').val()] = "ObjectId('" + $(keyValueRow).find('.query-value').val() + "')";
      } else if ($(keyValueRow).find('.query-value').attr('data-type') === 'number') {
        try {
          query[$(keyValueRow).find('.query-key').val()] = parseInt($(keyValueRow).find('.query-value').val());  
        } catch (e) {
          console.log(e, 'not a number')
        }        
      } else {
        query[$(keyValueRow).find('.query-key').val()] = $(keyValueRow).find('.query-value').val();
      }
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

  app.updateFilterType = function (e, element, next) {
    var queryValue = $(element).parent().parent().find('.query-value');
    var queryKey= $(element).parent().parent().find('.query-key');
    var queryValueWrapperLeft = $(element).parent().parent().find('.query-value-wrapper-left');
    var queryValueWrapperRight = $(element).parent().parent().find('.query-value-wrapper-right');
    var applyStringType = function () {
      queryValue.attr('data-type', 'string');
      queryValue.attr('placeholder', 'azat');
      queryKey.attr('placeholder', 'name');
      queryValueWrapperLeft.html('"');
      queryValueWrapperRight.html('"');
    }
    var applyNumberType = function (){
      queryValue.attr('data-type', 'number');
      queryValue.attr('placeholder', '10');
      queryKey.attr('placeholder', 'level');
      queryValueWrapperLeft.html('');
      queryValueWrapperRight.html('');
    }
    var applyIdType = function (){
      queryValue.attr('data-type', 'ID');
      queryValue.attr('placeholder', '5061da1e63e785cc44017668');
      queryKey.attr('placeholder', '_id');
      queryValueWrapperLeft.html('ObjectId("');
      queryValueWrapperRight.html('")');
    }    
    // console.log(queryValue, e.target.value)
    var typeName = e.target.value;
    switch (typeName) {
      case 'string': 
        applyStringType();
        break;
      case 'number':
        applyNumberType();
        break;
      case 'ID':
        applyIdType();
        break;
      default:
        applyStringType();
        break;
    }
    next();
  };

  app.formEnter = function(e, element, next) {
    // console.log(e)
    if (e.keyCode === 13) 
      app.applyFilter();
  };

  app.clearFilter = function(e, element, next){
    window.location.href = window.location.origin + window.location.pathname;
  };


});


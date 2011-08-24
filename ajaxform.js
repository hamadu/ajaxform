
(function($) {
$.fn.ajaxPost = function(callback, options, action) {
    var default_options = {
        data_type: 'html',
        before_send: function(){},
        error_handler: function(){}
    };

    options = $.extend(default_options, options)
    return this.each(function(){
        var f = $(this);
        var submit = f.find('input[type=submit]');
        
        if (!action) {
          action = f.attr('action');
        }
        $.ajax({
            url: action,
            type: 'POST',
            data: f.serialize() + '&mode=ajax',
            dataType: options.data_type,
            beforeSend: function() {
                submit.attr('disabled', 'disabled')
                options.before_send();
            },
            success: callback,
            complete: function(xhr, textStatus) {
                submit.removeAttr('disabled')
            }
        });
    });
}
})(jQuery);

ajaxform = function(){
  var _confirm_radio_checked = '<span class="checked">(o)</span>';
  var _confirm_radio_unchecked = '<span class="unchecked">(&nbsp;)</span>';
  var _confirm_checkbox_checked = '<span class="checked">[v]</span>';
  var _confirm_checkbox_unchecked = '<span class="unchecked">[&nbsp;]</span>';
  
  var _which_type = function(element) {
    if (element.tagName == 'INPUT') {
      return $(element).attr('type');
    } else if (element.tagName == 'SELECT') {
      return 'select';
    } else if (element.tagName == 'TEXTAREA') {
      return 'textarea';
    }
    return 'other';
  }
  
  var _input = function(formname) {
    $('#'+formname+' .input').show();
    $('#'+formname+' .confirm').hide();
    $(window).scrollTop(0);
  }

  var _confirm = function(formname) {
    $('#'+formname+' .input').hide();
    $('#'+formname+' .confirm').show();
    $(window).scrollTop(0);
  }

  var _complete = function(formname) {
    $('#'+formname).hide();
    $('.complete').show();
    $(window).scrollTop(0);
  }

  var _processError = function(formname, data) {
    for (var field in data['error']) {
      var message = data['error'][field]['message'];
      $('#'+formname+' span#error_'+field).append(message + '<br/>');
    }
    for (var field in data['global_error']) {
      var message = data['error'][field];
    }
  }
  
  var _confirm_input_text = function(value) {
    return '<input type="text" disabled="disabled" value ="%s" />'.replace("%s", value);
  }
  
  var _confirm_textarea = function(value) {
    return '<textarea disabled="disabled">%s</textarea>'.replace("%s", value);
  }
  

  var _confirm_radio_checkbox = function(values, selected, checked, unchecked) {
    var html = "";
    for (var i = 0 ; i < values.length ; i++) {
      var sel = false;
      for (var j = 0 ; j < selected.length ; j++) {
        if (selected[j] == i || selected[j] == values[i]) {
          sel = true;
          break;
        }
      }
      if (sel) {
        html += checked;
      } else {
        html += unchecked;
      }
      html += "" + values[i] + "&nbsp;&nbsp;";
    }
    return html;
  }

  return {
    ready : function(formname) {
      var form = $('form#' + formname);
      var list = $(':input', form).get();
      for (var i = 0 ; i < list.length ; i++) {
        var each = list[i];
        var type = _which_type(each);
        if (type != 'other' && type != 'button') {
          var id = $(each).attr('id');
          var baseParent = each.parentNode;
          if (!baseParent) {
            continue;
          }
          while (baseParent.tagName != 'DIV' && baseParent.tagName != 'TD') {
            baseParent = baseParent.parentNode;
          }
          
          if ($(baseParent).hasClass('ajaxform_processed')) {
            continue;
          }
          $(baseParent).addClass('ajaxform_processed');

          var error = $('<span class="error" id="error_%s">'.replace('%s', id));
          var input = $('<span class="input %s"></span>'.replace('%s', type));
          var confirm = $('<span class="confirm" id="confirm_%s">'.replace('%s', id));

          var inputs = $(baseParent).children().get();
          for (var j = 0 ; j < inputs.length ; j++) {
            input.append(inputs[j]);
          }

          $(baseParent).append(input);
          $(baseParent).append(error);
          $(baseParent).append(confirm);
        }
      }
      $('.ajaxform_processed', formname).each(function(){
        $(this).removeClass('ajaxform_processed');
      });
      
      $(form).attr('next_state', 'confirm');
    },
    cancel : function(formname) {
      $('#'+formname).attr('next_state', 'confirm');
      _input(formname);
    },
    post : function(formname) {
      $('#'+formname).submit();
    },
    simplesubmit : function(formname, action, callback_success, callback_error) {
      if (action == '') {
        action = $('#'+formname).attr('action');
      }
      $('#'+formname).ajaxPost(function(result_data){
        if (callback_success) {
          callback_success();
        }
      }, null, action);
  	},
    submit : function(formname, action, callback_success, callback_error) {
      if (action == '') {
        action = $('#'+formname).attr('action');
      }
      $('#'+formname).ajaxPost(function(result_data){
        $('#'+formname+' span.error').html('');
        var data = eval('(' + result_data + ')');
        if (data['has_error']) {
          _processError(formname, data);
          if (callback_error) {
            callback_error();
          }
          $(window).scrollTop(0);
        } else {
          var next_state = $('#'+formname).attr('next_state');
          if (next_state == 'confirm') {
            _confirm(formname);
            $('#'+formname).attr('next_state', 'complete');

            $('#'+formname+' span.input').each(function(){
              if ($(this).hasClass('text') || $(this).hasClass('file')) {
                var value = $('input', this).attr('value');
                var name = $('input', this).attr('id');
                
                $('#confirm_' + name).html(_confirm_input_text(value));
              }
              if ($(this).hasClass('password')) {
                var name = $('input', this).attr('id');
                $('#confirm_' + name).html(_confirm_input_text('********'));
              }
              if ($(this).hasClass('textarea')) {
                var value = $('textarea', this).attr('value');
                var name = $('textarea', this).attr('id');
                $('#confirm_' + name).html(_confirm_textarea(value));
              }
              if ($(this).hasClass('date')) {
                  var year = $($('select option:selected', this)[0]).attr('value');
                  var month = $($('select option:selected', this)[1]).attr('value');
                  var day = $($('select option:selected', this)[2]).attr('value');
                  var name = $($('select', this)[0]).attr('id').split("_year")[0];
                  $('#confirm_' + name).html(year + '年' + month + '月' + day + '日');
              }
              if ($(this).hasClass('select')) {
                var value = $('select option:selected', this).html();
                var name = $('select', this).attr('id');
                $('#confirm_' + name).html(value);
              }
              if ($(this).hasClass('radio') || $(this).hasClass('checkbox')) {
                var all_input = $('input', this).get();
                var is_after = false;
                var values = [];
                var checked = [];
                for (var i = 0 ; i < all_input.length ; i++) {
                  if (i == 0 && !$(all_input[i]).prev().html()) {
                    is_after = true;
                  }
                  if ($(all_input[i]).attr('checked')) {
                    checked.push(i);
                  }

                  var value = "";
                  if (is_after) {
                    value = $(all_input[i]).next().html().trim();
                  } else {
                    value = $(all_input[i]).prev().html().trim();
                  }
                  values.push(value);
                }
                
                var first = $('input', this).get(0);
                var html = "";
                if ($(this).hasClass('radio')) {
                  html = _confirm_radio_checkbox(values, checked, _confirm_radio_checked, _confirm_radio_unchecked);
                } else {
                  html = _confirm_radio_checkbox(values, checked, _confirm_checkbox_checked, _confirm_checkbox_unchecked);                  
                }
                $('#confirm_' + $(first).attr('id')).html(html);
              }
            });
          } else {
            _complete(formname);
            if (callback_success) {
              callback_success();
            }
          }
        }
      }, null, action);
    }
  }
}();






/*
<span class="input password">
  <input type="password" name="register[password]" id="register_password" />
</span>
<span class="error" id="error_password"></span>
<span class="confirm" id="confirm_register_password"></span>

*/

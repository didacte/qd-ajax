import request from 'qd-ajax/request';
import DS from 'ember-data';
import ENV from '../config/environment';

export default {
  name: 'qd-ajax',
  initialize: function(application) {
    if(request.OVERRIDE_REST_ADAPTER) {
      DS.RESTAdapter.reopen({
        ajax: function(url, type, options){
          options = this.ajaxOptions(url, type, options);
          return request(options);
        }
      });
    }
  }
}

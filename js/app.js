$(function() {
  $('#ri-grid').gridrotator({
    w1024: {rows: 2, columns: 3},
    w768 : {rows: 2, columns: 3},
    w480 : {rows: 2, columns: 3},
    w320 : {rows: 3, columns: 4},
    w240 : {rows: 3, columns: 3}
  });

  var loading = function(isLoading) {
    var $e = $('#loading');
    isLoading === true ? $e.show() : $e.hide();
  }

  var submitted = false;
  var $form = $('#demoLicense form');
  $form.validate({
    submitHandler: function(form) {
      if (submitted) {
        return;
      }
      submitted = true;
      loading(true);
      $.ajax({
        url: form.action,
        cache: false,
        type: 'POST',
        data: $form.serialize(),
        dataType: "jsonp",
        //timeout: 1000,
        crossDomain: true,
        success: function (data, status) {
            if (data == 'OK') {
                $form.parent().html("Спасибо за Вашу заявку")
            } else {
                $form.parent().html("Ошибка: " + data);
            }
        },
        error: function (xOptions, textStatus) {
            submitted = false;
            console.log(textStatus);
        },
        complete: function() {
            loading(false);
        }
      });
    }
  });
 
  var ViewModel = function(cards, poster, delivery) {
      this.cards = ko.observable(cards);
      this.poster = ko.observable(poster);
      this.delivery = ko.observable(delivery);
      this.deliveryOptions = [{
          disable: true,
          text: 'Самовывоз'
      }, {
          disable: true,
          text: 'Курьер'
      }, {
          disable: false,
          text: 'Посылка'
      }];
      for (var i in this.deliveryOptions) {
          var option = this.deliveryOptions[i];
          option.disable = ko.observable(option.disable);
      }
      this.addressCity = ko.observable();

      var productCost = function(value) {
          // discount if 10
          return value ? value + " * 399 : " + value * 399 + " руб" : "";
      };

      this.cardsCost = ko.pureComputed(function() {
          return productCost(this.cards());
      }, this);

      this.posterCost = ko.pureComputed(function() {
          return productCost(this.poster());
      }, this);

      var self = this;
      this.deliveryChanged = function(value) {
          self.delivery(value.text);
      };

      this.deliveryCost = ko.pureComputed(function() {
          var delivery = this.delivery();
          return delivery ? delivery : '';
      }, this);

      this.disableDeliveryOption = function(option, disable) {
          option.disable(disable);
          if (this.delivery() == option.text) {
              this.delivery('');
          }
      }

      this.addressChanged = function(value) {
          var selected = value.split(",");
          console.log(selected);
          this.addressCity(selected[0]);
          var disable = selected[0] != 'Москва';
          this.disableDeliveryOption(this.deliveryOptions[0], disable);
          this.disableDeliveryOption(this.deliveryOptions[1], disable);
      };
  };

  var model = new ViewModel(1, 0);
  ko.applyBindings(model);
  
  var ratings = $('select.barrating');
  ratings.barrating('show', {showValues: true, showSelectedRating:false, onSelect: function(value, text) {
      ratings.change(); // notify Knockout
  }});

  // https://code.google.com/p/yogamamadvd/source/browse/trunk/catalog/view/theme/yogamamadvd/templates/account/register.html#219
  $('.typeahead').typeahead({
    source: function(query, process) {
      var url = "http://ws.geonames.org/searchJSON?name_startsWith=" + query + "&featureClass=P&maxRows=10&stye=full&username=avalez&lang=ru";
      $.getJSON(url, function(data) {
        process($.map(data.geonames, function(item) {
          return item.name + (item.adminName1 ? ", " + item.adminName1 : "") + ", " + item.countryName + ", " + item.countryCode;
        }));
      });
    },
    minLength: 3,
    updater: function(item) {
      if (item) {
        model.addressChanged(item);
      }
      return item;
    }
  });
});

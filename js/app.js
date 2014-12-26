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
          text: 'Самовывоз',
          comment: 'м.Щелковская, м. Павелецкая или м.Водный стадион',
          cost: 0
      }, {
          disable: true,
          text: 'Курьер',
          comment: 'Доставка до любой станции метро',
          cost: 300
      }, {
          disable: false,
          text: 'Почта',
          comment: 'Почтой России, срок доставки 7-10 дней',
          cost: 0
      }];
      for (var i in this.deliveryOptions) {
          var option = this.deliveryOptions[i];
          option.disable = ko.observable(option.disable);
      }
      this.addressCity = ko.observable();

      var productCost = function(value) {
          // TODO: discount if 10
          return value * 399;
      };

      this.cardsCost = ko.pureComputed(function() {
          return productCost(this.cards());
      }, this);

      this.posterCost = ko.pureComputed(function() {
          return productCost(this.poster());
      }, this);

      this.addressChanged = function(value) {
          var selected = value.split(",");
          this.addressCity(selected[0]);
          var disable = selected[0] != 'Москва';
          this.disableDeliveryOption(this.deliveryOptions[0], disable);
          this.disableDeliveryOption(this.deliveryOptions[1], disable);
      };

      this.disableDeliveryOption = function(option, disable) {
          option.disable(disable);
          if (this.delivery() == option.text) {
              this.delivery('');
          }
      };

      var self = this;
      this.deliveryChanged = function(value) {
          self.delivery(value);
      };

      this.deliveryCost = ko.pureComputed(function() {
          var delivery = this.delivery();
          if (!delivery) {
              return '';
          }
          var cost = delivery.cost;
          var cards = this.cards() || 0;
          var poster = this.poster() || 0;
          if (poster > 0 && delivery.text == 'Почта') {
              cost += 100 + 200; // FIXME: weight
          }
          if (cards > 0 && delivery.text == 'Почта') {
              cost += 100;
          }
          return cost;
      }, this);

      this.totalCost = ko.pureComputed(function() {
          return this.cardsCost() + this.posterCost() + this.deliveryCost();
      }, this);
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

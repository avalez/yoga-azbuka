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
      this.addressCity = ko.observable();
      this.delivery = ko.observable(delivery);
      this.deliveryOptions = [{
          disable: ko.pureComputed(function() {
              return !this.addressIsMoscow();
          }, this),
          text: 'Самовывоз',
          comment: 'м.Щелковская, м. Павелецкая или м.Водный стадион'
      }, {
          disable: ko.pureComputed(function() {
              return !this.addressIsMoscow();
          }, this),
          text: 'Курьер',
          comment: 'Доставка до станции метро 300 руб'
      }, {
          disable: false,
          text: 'Почта',
          comment: 'Срок доставки по России 7-10 дней, в другие страны 10-14 дней'
      }, {
          disable: false,
          text: 'EMS',
          comment: 'Срок доставки по России 2-4 дня, в другие страны 4-14 дней'
      }];

      var productCost = function(value) {
          var discount = value >= 10 ? 0.9 : 1;
          return Math.round(value * 399 * discount);
      };

      this.cardsCost = ko.pureComputed(function() {
          return productCost(this.cards());
      }, this);

      this.posterCost = ko.pureComputed(function() {
          return productCost(this.poster());
      }, this);

      this.addressIsMoscow =  ko.pureComputed(function() {
          var address = this.addressCity();
          return address && address.split(",")[0] == 'Москва';
      }, this);

      this.addressIsRussia =  ko.pureComputed(function() {
          var address = this.addressCity();
          return address && address.split(",")[3].trim() == 'RU';
      }, this);

      var self = this;
      this.deliveryChanged = function(value) {
          self.delivery(value);
      };

      this.addressCity.subscribe(function() {
          var delivery = self.delivery();
          if (delivery && delivery.disable) {
              self.delivery('');
          }      
      });

      this.deliveryCost = ko.pureComputed(function() {
          var delivery = this.delivery();
          if (!delivery) {
              return '';
          }
          var cards = this.cards() || 0;
          var poster = this.poster() || 0;
          var cost = 0;
          var weightFactor = Math.max(0, Math.floor((poster + cards - 1) / 2));
          if (delivery.text == 'Почта') {
              if (poster > 0) {
                  cost = 100 + (this.addressIsRussia() ? 200 : 1000);
              } else if (cards > 0) {
                  cost =  this.addressIsRussia() ? 100 : 300;
              }
              cost += weightFactor * (this.addressIsRussia() ? 50 : 100);
          } else if (delivery.text == 'EMS') {
              if (poster > 0) {
                  cost = 100 + (this.addressIsRussia() ? 650 : 1250);
              } else if (cards > 0) {
                  cost = this.addressIsRussia() ? 650 : 1250;
              }
              cost += weightFactor * (this.addressIsRussia() ? 50 : 200);
          } else if (delivery.text == 'Курьер') {
              cost = 350;
          }
          return cost;
      }, this);

      this.deliveryComment = ko.pureComputed(function() {
            var delivery = this.delivery();
            return delivery ? delivery.comment : '';
        }, this);

      this.totalCost = ko.pureComputed(function() {
          return this.cardsCost() + this.posterCost() + this.deliveryCost();
      }, this);
  };

  ko.applyBindings(new ViewModel(1, 0));
  
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
    minLength: 3
  });
});

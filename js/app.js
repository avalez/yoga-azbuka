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

  var ViewModel = function(cards, posters, delivery) {
      this.cards = ko.observable(cards);
      this.posters = ko.observable(posters);
      this.delivery = ko.observable(delivery);

      var productCost = function(value) {
          // discount if 10
          return value ? value + " * 399 руб: " + value * 399 + " руб" : "0 руб";
      };

      this.cardsCost = ko.pureComputed(function() {
          return productCost(this.cards());
      }, this);

      this.postersCost = ko.pureComputed(function() {
          return productCost(this.posters());
      }, this);

      var self = this;
      this.deliveryChanged = function(value) {
          self.delivery(value);
      }

      this.deliveryCost = ko.pureComputed(function() {
          return this.delivery();
      }, this);
  };

  ko.applyBindings(new ViewModel(1, 0));
  
  var ratings = $('select.barrating');
  var ratingChanged = function(value, text) {
      ratings.change();
  }
  ratings.barrating('show', {showValues: true, showSelectedRating:false, onSelect: ratingChanged});

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
        var selected = item.split(",");
        // TODO: strip countryCode
      }
      return item;
    }
  });
});

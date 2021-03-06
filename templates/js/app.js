if (window.location.host.indexOf("yoga-azbuka.ru") >= 0 && window.location.protocol != "https:") {
  window.location.protocol = "https:"
}
$(function() {
  var keen = new Keen({
    projectId: "5404e1400727190dcd000006",
    writeKey: "8d07d6b532819bbed7f278ed1a214d9f13adc73a93900bf93042ce598684cd383ddb3cd943348de232b6eeef3c504ec0de70797003747fd0223b1ba86ebcd0dfe58b42698d39161368be09ee37514c5152da505cd619caa7dcc960dfd30c0d11ccd496f8b529a5314efc34bd9ba94ccf"
  });

  var share = {
    referrer: document.referrer,
    keen: {
      timestamp: new Date().toISOString()
    }
  };

  // https://stackoverflow.com/questions/23116001/facebook-like-and-share-button-with-callback
  var $fbFeed = $('#fb-feed');
  $fbFeed.click(function(e) {
    e.preventDefault();
    FB.ui({
      method: 'feed',
      name: 'Йога Азбука для детей',
      link: 'https://www.yoga-azbuka.ru/',
      picture: 'https://www.yoga-azbuka.ru/images/cards-sample.jpg',
      caption: 'Плакат, карточки и расраски с азбукой для занятий йогой с детьми',
      description: 'Материалы „Йога-азбука для детей“ могут стать отличным подароком для детей и родителей, увлеченных йогой.'
    }, function(response) {
      if (response && response.post_id) {
        if ($('#download')[0]) return;
        share.post_id = response.post_id;
        $fbFeed.parent().append(
          $("<a/>").attr({
            class: "btn btn-success",
            href: "/images/peabig.jpg",
            download: "pea.jpg",
            style: "color: #fff"
          }).text('Скачать раскраску'));
        ga('send', 'social', 'facebook', 'share', 'https://www.yoga-azbuka.ru/', {page: '/'});
        ga('send', 'event', 'social', 'facebook', 'share');
        keen.addEvent("shares", share);
      }
    });
  });

  var $fbShare = $('#fb-share');
  $fbShare.click(function(e) {
    e.preventDefault();
    FB.ui({
      method: 'share',
      href: 'https://www.yoga-azbuka.ru/',
    }, function(response) {
      if (response && !response.error_code) {
        if ($('#download')[0]) return;
        $fbShare.parent().append(
          $("<button/>").attr({
            class: "btn btn-success"
          }).append($("<a/>").attr({
            id: "download",
            href: "/images/peabig.jpg",
            download: "pea.jpg",
            style: "color: #fff"
          }).text('Скачать раскраску')));
        ga('send', 'social', 'facebook', 'share', 'https://www.yoga-azbuka.ru/', {page: '/'});
        ga('send', 'event', 'social', 'facebook', 'share');
      } else if (response) {
        share.error_code = response.error_code; // debug
      }
      keen.addEvent("shares", share);
    });
  });

  var gridrotator = $('#ri-grid').gridrotator({
    w1024: {rows: 2, columns: 3},
    w768 : {rows: 2, columns: 3},
    w480 : {rows: 2, columns: 3},
    w320 : {rows: 3, columns: 4},
    w240 : {rows: 3, columns: 3}
  });

  $('#wizard').on('slid', function(event) {
    if ($(this.children[0]).hasClass('active')) {
      gridrotator.$el.resize();
    } else if ($(this.children[1]).hasClass('active')) {
      var url = $('form.order').attr('action');
      $.ajax({
        url: url,
        cache: false,
        type: 'GET',
        crossDomain: true
      });
    }
  });

  var loading = function(isLoading) {
    var $e = $('#loading');
    isLoading === true ? $e.show() : $e.hide();
  }

  $.validator.setDefaults({
      ignore: [], // validate hidden fields
  });
  var $form = $('form.product');
  $form.validate({
    errorPlacement: function(error, element) {
      if (element.attr('name') == 'cards' || element.attr('name') == 'poster') {
        error.insertAfter($('.br-widget', element.parent()));
      } else {
        error.insertAfter(element);
      }
    },
    rules: {
      cards: {
        required: function(element) {
          return !$("select[name='poster']").val();
        }
      },
      poster: {
        required: function(element) {
          return !$("select[name='cards']").val();
        }
      }
    },
    submitHandler: function(form) {
      $('#wizard').carousel('next');
    }
  });

  var submitted = false;
  var $form = $('form.order');
  $form.validate({
    submitHandler: function(form) {
      if (submitted) {
        return;
      }
      ga('send', 'event', 'order', 'create');
      submitted = true;
      loading(true);
      $.ajax({
        url: form.action,
        cache: false,
        type: 'POST',
        data: $form.serialize(),
        //timeout: 1000,
        crossDomain: true,
        success: function (data, status) {
            if (data == 'OK') {
                $form.parent().html("<h3>Спасибо за Ваш заказ!</h3><p>Ваш заказ успешно оформлен.</p>")
            } else {
                $form.parent().html('<h3 class="error">Ошибка :(</h3><p>' + data + '</p');
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
    },
    rules: {
      full_name: {
        fullName: function(element) {
          return ['Почта'].indexOf($(".order input[name='delivery']").val()) != -1;
        }
      }
    }
  });

  var ViewModel = function(cards, poster) {
      this.cards = ko.observable(cards);
      this.poster = ko.observable(poster);
      this.addressCity = ko.observable();
      this.delivery = ko.observable('');
      this.deliveryOptions = [{
          disable: ko.observable(true),
          text: 'Самовывоз',
          comment: 'м.Чертановская'
      }, {
          disable: ko.observable(true),
          text: 'Курьер',
          comment: 'Доставка до адреса 350 руб'
      }, {
          disable: ko.observable(true),
          text: 'Почта',
          comment: ko.observable('Срок доставки 3-30 дней')
      }, {
          disable: ko.observable(false),
          text: 'Другое',
          comment: 'На сайте партнеров: http://bambinilavka.ru/shop/komplekt-yoga-azbuka'
      }];
      this.payment = ko.observable('');
      this.paymentOptions = [{
          disable: ko.observable(true),
          text: 'При получении'
      }, {
          disable: false,
          text: 'PayPal'
      }, {
          disable: false,
          text: 'Перевод',
          comment: 'Перевод на карту или счет Сбербанк'
      }];
      this.phone = ko.observable();
      this.addressStreet = ko.observable();
      this.addressIndex = ko.observable();
      this.comment = ko.observable();

      this.discount = ko.pureComputed(function() {
          return this.cards() + this.poster() >= 10 ? 0.1 : 0;
      }, this);

      this.productCost = function(value, cost) {
          var discount = this.discount();
          return value * cost * (1 - discount);
      };

      this.cardsCost = ko.pureComputed(function() {
          return this.productCost(this.cards(), 790);
      }, this);

      this.posterCost = ko.pureComputed(function() {
          return this.productCost(this.poster(), 690);
      }, this);

      this.isAddressMoscow = ko.pureComputed(function() {
          var address = this.addressCity() || '';
          address = address.toLowerCase();
          return address.indexOf('москва') >= 0 && address.indexOf('россия') >= 0;
      }, this);

      this.isAddressRussia = ko.pureComputed(function() {
          var address = this.addressCity() || '';
          address = address.toLowerCase();
          return address.indexOf('россия') >= 0;
      }, this);

      this.isDeliveryPrepaid = ko.pureComputed(function() {
          var delivery = this.delivery();
          return !delivery || ['Почта'].indexOf(delivery.text) != -1;
      }, this);

      var self = this;
      this.deliveryChanged = function(value) {
          self.delivery(value);
      };

      this.paymentChanged = function(value) {
          self.payment(value);
      };

      this.cards.subscribe(function (value) {
          self.deliveryOptions[2].disable(self.poster() + value < 3);
      });

      this.poster.subscribe(function (value) {
          self.deliveryOptions[2].disable(self.cards() + value < 3);
      });

      this.addressCity.subscribe(function() {
          var isAddressMoscow = self.isAddressMoscow();
          var isAddressRussia = self.isAddressRussia();
          self.deliveryOptions[2].disable(isAddressRussia);
          self.deliveryOptions[0].disable(!isAddressMoscow);
          self.deliveryOptions[1].disable(!isAddressMoscow);
          self.deliveryOptions[3].disable(isAddressMoscow || !isAddressRussia);
          if (isAddressRussia) {
              self.delivery(self.deliveryOptions[3]);
              $('button[name="delivery"]:contains("Другое")').addClass('active');
          }
          var delivery = self.delivery();
          if (delivery && $.isFunction(delivery.disable) && delivery.disable()) {
              self.delivery('');
              $('button[name="delivery"].active').removeClass('active');
          }
      });

      this.delivery.subscribe(function() {
          self.paymentOptions[0].disable(self.isDeliveryPrepaid());
          var payment = self.payment();
          if (payment && $.isFunction(payment.disable) && payment.disable()) {
              self.payment('');
              $('button[name="payment"].active').removeClass('active');
          }
          if (!self.isPhoneNeeded()) {
              self.phone('');
          }
          if (!self.isStreetNeeded()) {
              self.addressStreet('');
          }
          if (!self.isIndexNeeded()) {
              self.addressIndex('');
          }
      });

      this.deliveryCost = ko.pureComputed(function() {
          var delivery = this.delivery();
          if (!delivery) {
              return 0
          }
          var cards = this.cards() || 0;
          var poster = this.poster() || 0;
          var cost = 0;
          var weightFactor = Math.max(0, Math.floor((poster + cards - 1) / 2));
          if (delivery.text == 'Почта') {
              if (poster + poster > 0 && this.cardsCost() + this.posterCost() < 3000) {
                  cost += this.isAddressMoscow() ? 150 : this.isAddressRussia() ? 200 : 600;
              }
           } else if (delivery.text == 'Курьер') {
              cost = 350;
          }
          return cost;
      }, this);

      this.paymentCost = ko.pureComputed(function() {
        var payment = this.payment();
        if (payment && payment.text == 'PayPal') {
            var totalCost = this.cardsCost() + this.posterCost() + this.deliveryCost();
            return Math.round(totalCost * .047) + 10;
        } else {
            return 0;
        }
      }, this);

      this.totalComment = ko.pureComputed(function() {
            var delivery = this.delivery();
            return delivery && ['Почта', 'Другое'].indexOf(delivery.text) >= 0 ?
                'Конечная стоимость будет указана при оформлении заказа' : '';
        }, this);

      this.totalCost = ko.pureComputed(function() {
          return this.cardsCost() + this.posterCost() + this.deliveryCost() + this.paymentCost();
      }, this);

      this.isPhoneNeeded = ko.pureComputed(function() {
          var delivery = this.delivery();
          return delivery && (['Самовывоз', 'Курьер', 'Другое'].indexOf(delivery.text) != -1);
      }, this);

      this.isStreetNeeded = ko.pureComputed(function() {
          var delivery = this.delivery();
          return delivery && (['Самовывоз', 'Другое'].indexOf(delivery.text) == -1);
      }, this);

      this.isIndexNeeded = ko.pureComputed(function() {
          var delivery = this.delivery();
          return delivery && (['Самовывоз', 'Курьер', 'Другое'].indexOf(delivery.text) == -1);
      }, this);

      this.order = ko.pureComputed(function() {
          var order = [];
          var product = '';
          var cards = this.cards();
          if (cards > 0) {
            product += "Набор карточек: " + cards + " шт.";
          }
          var poster = this.poster();
          if (poster > 0) {
            if (product) {
                product += ', ';
            }
            product += "Плакат: " + poster + " шт.";
          }
          order.push(product);
          var delivery = this.delivery();
          if (delivery) {
              order.push("Способ доставки: " + delivery.text);
          }
          var address = '';
          if (this.isStreetNeeded()) {
              address += (this.addressStreet() || '');
          }
          if (address && this.addressCity()) {
              address += ', ';
          }
          address += (this.addressCity() || '');
          if (this.isIndexNeeded()) {
              if (address && this.addressIndex()) {
                  address += ', ';
              }
              address += (this.addressIndex() || '');
          }
          if (this.isPhoneNeeded() && this.phone()) {
              if (address && this.phone()) {
                  address += ', ';
              }
              if (this.phone()) {
                  address += "тел. " + this.phone();
              }
          }
          order.push("Адрес: " + address);
          var payment = this.payment();
          if (payment) {
              order.push("Способ оплаты: " + payment.text);
          }
          order.push("Стоимость: " + this.totalCost() + " руб.");
          if (this.comment()) {
              order.push("Комментарий: " + this.comment());
          }
          return order.join('\n');
      }, this);
  };

  ko.applyBindings(new ViewModel(0, 1));

  var ratings = $('select.barrating');
  ratings.barrating('show', {showValues: true, showSelectedRating:false, onSelect: function(value, text) {
      ratings.change(); // notify Knockout
  }});

  // https://code.google.com/p/yogamamadvd/source/browse/trunk/catalog/view/theme/yogamamadvd/templates/account/register.html#219
  $('.typeahead').typeahead({
    source: function(query, process) {
      var url = "https://secure.geonames.org/searchJSON?name_startsWith=" + query + "&featureClass=P&cities=cities1000&maxRows=10&stye=full&username=avalez&lang=ru";
      $.getJSON(url, function(data) {
        process($.map(data.geonames, function(item) {
          return item.name + (item.adminName1 ? ", " + item.adminName1 : "") + ", " + item.countryName;
        }));
      });
    },
    minLength: 3
  });

  // https://stackoverflow.com/questions/2457032/jquery-validation-change-default-error-message
  $.extend($.validator.messages, {
      required: "Это поле обязательное.",
      number: "Пожалуйста введите число.",
      email: "Пожалуйста введите адрес электронной почты.",
  });

  $.validator.addMethod("phoneRU", function(phone_number, element) {
      phone_number = phone_number.replace(/\s+/g, "");
      var match = phone_number.match(/^(\+7|8|\+)\s?(\(?\d\d\d\)?)\s?(\d\d\d)[\s-]?(\d\d\d?)[\s-]?(\d\d\d?)$/);
      return this.optional(element) || (phone_number.length > 10 && match);
  }, "Пожалуйста введите номер телефона.");

  $.validator.addMethod("fullName", function(full_name, element, enabled) {
      full_name = full_name.trim().replace(/\s+/g, ' ');
      var match = full_name.split(' ');
      return this.optional(element) || !enabled || match.length > 2;
  }, "Пожалуйста введите Фамилию Имя Отчетсво.");

  $('.more').hide();
  $('.readmore').click(function(e) {
      e.preventDefault();
      var $el = $(e.target);
      $('.more', $el.parent().parent()).show();
      $el.hide();
  });

});

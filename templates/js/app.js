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

  // http://stackoverflow.com/questions/23116001/facebook-like-and-share-button-with-callback
  var $fbFeed = $('#fb-feed');
  $fbFeed.click(function(e) {
    e.preventDefault();
    FB.ui({
      method: 'feed',
      name: 'Йога Азбука для детей',
      link: 'http://www.yoga-azbuka.ru/',
      picture: 'http://www.yoga-azbuka.ru/images/cards-sample.jpg',
      caption: 'Плакат, карточки и расраски с азбукой для занятий йогой с детьми',
      description: 'Материалы „Йога-азбука для детей“ могут стать отличным подароком для детей и родителей, увлеченных йогой.'
    }, function(response) {
      if (response && response.post_id) {
        if ($('#download')[0]) return;
        share.post_id = response.post_id;
        $fbFeed.parent().append(
          $("<button/>").attr({
            class: "btn btn-success"
          }).append($("<a/>").attr({
            href: "/images/dogbig.jpg",
            download: "dogbig.jpg",
            style: "color: #fff"
          }).text('Скачать раскраску')));
        ga('send', 'social', 'facebook', 'share', 'http://www.yoga-azbuka.ru/', {page: '/'});
        ga('send', 'event', 'social', 'facebook', 'share');
      }
      keen.addEvent("shares", share);
    });
  });

  var $fbShare = $('#fb-share');
  $fbShare.click(function(e) {
    e.preventDefault();
    FB.ui({
      method: 'share',
      href: 'http://www.yoga-azbuka.ru/',
    }, function(response) {
      if (response && !response.error_code && false) {
        if ($('#download')[0]) return;
        $fbShare.parent().append(
          $("<button/>").attr({
            class: "btn btn-success"
          }).append($("<a/>").attr({
            id: "download",
            href: "/images/starbig.jpg",
            download: "startbig.jpg",
            style: "color: #fff"
          }).text('Скачать раскраску')));
        ga('send', 'social', 'facebook', 'share', 'http://www.yoga-azbuka.ru/', {page: '/'});
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
      var fullName = $form.find('input[name="full_name"]').val();
      var names = fullName.split(/[\s,]+/);
      $form.find('input[name="first_name"]').val(names[0]);
      if (names.length > 1) {
        $form.find('input[name="last_name"]').val(names[1]);
      }
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
          comment: ko.pureComputed(function() {
              return this.addressIsRussia() ? 'Срок доставки 7-10 дней' : 'Срок доставки 10-14 дней';
            }, this)
      }, {
          disable: ko.pureComputed(function() {
              return this.addressIsMoscow();
            }, this),
          text: 'EMS',
          comment: ko.pureComputed(function() {
              return this.addressIsRussia() ? 'Срок доставки 2-4 дня' : 'Срок доставки 4-14 дней';
            }, this)
        }, {
          disable: ko.pureComputed(function() {
              return this.addressIsMoscow();
            }, this),
          text: 'Другое',
          comment: 'Самовывоз/курьер в Мовскве'
      }];
      this.phone = ko.observable();
      this.addressStreet = ko.observable();

      this.discount = ko.pureComputed(function() {
          return this.cards() + this.poster() >= 10 ? 0.1 : 0;
      }, this);

      this.productCost = function(value) {
          var discount = this.discount();
          return value * 399 * (1 - discount);
      };

      this.cardsCost = ko.pureComputed(function() {
          return this.productCost(this.cards());
      }, this);

      this.posterCost = ko.pureComputed(function() {
          return this.productCost(this.poster());
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
              cost += weightFactor * (this.addressIsRussia() ? 50 : 150);
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

      this.totalComment = ko.pureComputed(function() {
            var delivery = this.delivery();
            return delivery && ['Почта', 'EMS', 'Другое'].indexOf(delivery.text) >= 0 ?
                'Конечная стоимость будет указана при оформлении заказа' : '';
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

  // http://stackoverflow.com/questions/2457032/jquery-validation-change-default-error-message
  $.extend($.validator.messages, {
      required: "Это поле обязательное.",
      email: "Пожалуйста введите адрес электронной почты."
  });

  $.validator.addMethod("phoneRU", function(phone_number, element) {
  	var phone_number = phone_number.replace(/\s+/g, "");
  	var match = phone_number.match(/^((\+7)|8)((\(\d{3}\))|(\d{3}))\d\d\d-?\d\d-?\d\d$/); //spaces are trimmed
  	return this.optional(element) || phone_number.length > 11 && match;
  }, "Пожалуйста введите номер телефона.");
  
});

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

  var $fbFeed = $('#fb-feed');
  $fbFeed.click(function(e) {
    e.preventDefault();
    FB.ui({
      method: 'feed',
      name: 'Йога Азбука для детей',
      link: 'http://www.yoga-azbuka.ru/',
      picture: 'http://www.yoga-azbuka.ru/images/cards-sample.jpg',
      caption: 'Плакат и расраска по занятию йогой с азбукой для детей',
      description: 'Материалы „Йога-азбука для детей“ могут стать отличным подароком для детей и родителей, увлеченных йогой.',
      redirect_uri: 'http://www.yoga-azbuka.ru/'
    }, function(response) {
      if (response && response.post_id) {
        if ($('#download')[0]) return;
        share.post_id = response.post_id;
        $fbFeed.parent().append(
          $("<button/>").attr({
            class: "btn btn-success"
          }).append($("<a/>").attr({
            href: "/images/starbig.jpg",
            download: "startbig.jpg",
            style: "color: #fff"
          }).text('Скачать раскраску')));
        ga('send', 'social', 'facebook', 'share', 'http://www.yoga-azbuka.ru/', {page: '/'});
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
      if (response && !response.error_code) {
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
      } else if (response) {
        share.error_code = response.error_code; // debug
      }
      keen.addEvent("shares", share);
    });
  });

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
});

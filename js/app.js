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
      name: 'ÐÐ¾Ð³Ð° ÐÐ·Ð±ÑÐºÐ° Ð´Ð»Ñ Ð´ÐµÑÐµÐ¹',
      link: 'http://www.yoga-azbuka.ru/',
      picture: 'http://www.yoga-azbuka.ru/images/cards-sample.jpg',
      caption: 'ÐÐ»Ð°ÐºÐ°Ñ, ÐºÐ°ÑÑÐ¾ÑÐºÐ¸ Ð¸ ÑÐ°ÑÑÐ°ÑÐºÐ¸ Ñ Ð°Ð·Ð±ÑÐºÐ¾Ð¹ Ð´Ð»Ñ Ð·Ð°Ð½ÑÑÐ¸Ð¹ Ð¹Ð¾Ð³Ð¾Ð¹ Ñ Ð´ÐµÑÑÐ¼Ð¸',
      description: 'ÐÐ°ÑÐµÑÐ¸Ð°Ð»Ñ âÐÐ¾Ð³Ð°-Ð°Ð·Ð±ÑÐºÐ° Ð´Ð»Ñ Ð´ÐµÑÐµÐ¹â Ð¼Ð¾Ð³ÑÑ ÑÑÐ°ÑÑ Ð¾ÑÐ»Ð¸ÑÐ½ÑÐ¼ Ð¿Ð¾Ð´Ð°ÑÐ¾ÐºÐ¾Ð¼ Ð´Ð»Ñ Ð´ÐµÑÐµÐ¹ Ð¸ ÑÐ¾Ð´Ð¸ÑÐµÐ»ÐµÐ¹, ÑÐ²Ð»ÐµÑÐµÐ½Ð½ÑÑ Ð¹Ð¾Ð³Ð¾Ð¹.'
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
          }).text('Ð¡ÐºÐ°ÑÐ°ÑÑ ÑÐ°ÑÐºÑÐ°ÑÐºÑ')));
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
          }).text('Ð¡ÐºÐ°ÑÐ°ÑÑ ÑÐ°ÑÐºÑÐ°ÑÐºÑ')));
        ga('send', 'social', 'facebook', 'share', 'http://www.yoga-azbuka.ru/', {page: '/'});
        ga('send', 'event', 'social', 'facebook', 'share');
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
                $form.parent().html("Ð¡Ð¿Ð°ÑÐ¸Ð±Ð¾ Ð·Ð° ÐÐ°ÑÑ Ð·Ð°ÑÐ²ÐºÑ")
            } else {
                $form.parent().html("ÐÑÐ¸Ð±ÐºÐ°: " + data);
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

'use strict';


jQuery(function ($) {

  var $carousel = $('#carousel');
  var $carouselIndicators = $carousel.find('.carousel-indicators');
  var $carouselInner = $carousel.find('.carousel-inner');
  var $carouselControl = $carousel.find('.carousel-control');

  $.getJSON('/_images', function (images, textStatus, xhr) {

    $.each(images, function (i) {

      var className = (i === 0) ? 'active' : '';

      $carouselIndicators.append([
        '<li data-target="#carousel" data-slide-to="' + i + '" ',
        'class="' + className + '"></li>'
      ].join(''));

      $carouselInner.append([
        '<div class="item ' + className + '" ',
        'style="background-image: url(/_images/' + this.id + ')">',
        '</div>'
      ].join(''));
    });

    $carouselIndicators.removeClass('hide');
    $carouselControl.removeClass('hide');
    $carousel.carousel();
  });

});


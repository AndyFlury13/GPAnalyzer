function counterControl(target, number, config) {
  const numberString = number.toString();
  const numArray = numberString.split('');
  const defaults = {
    speed: 3000,
    isDigitBg: false,
    comma: true,
  };
  $.extend(defaults, config);

  target.empty();
  target.html('<span class="pplNum"></span>');

  numArray.forEach((num, i) => {
    let html = '';
    numArray[i] = parseInt(num, 10);
    if (defaults.isDigitBg) {
      html = `<span class="digit-con"><span class="digit${i}"></span></span>`;
    } else {
      html = `<span class="digit-con"><span class="digit${i}">0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br>0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br></span></span>`;
    }
    target.find('.pplNum').append(html);
  });

  if (defaults.comma) {
    target.find('.digit-con:nth-last-child(3n+4)').after("<span class='comma'>,</a>");
  }

  numArray.forEach((num, i) => {
    const increment = target.find('.digit-con').outerHeight();
    target.find(`.digit${i}`).delay(i * 300).animate({ top: -((increment * num) + (increment * 10)) }, defaults.speed, 'linear');
  });
}

const displayStats = async (clientName) => {
  $.getJSON('/scripts/data/overallStats.json', (data) => {
    $('.introBlurb0').html(`Hi ${clientName}! Over the past year, we uploaded <span class='userNumBar0'></span><span class='userImgNumBar'></span>`
        + '</span> pictures to the Hilledwight photo drive.').promise().done(() => {
      $('.introBlurb0').fadeIn(4000, () => {
        $('.introBlurb1').html("You uploaded <span class='userNumBar1'></span><span class='userImgNumBar'></span> pictures,").promise().done(() => {
          $('.introBlurb1').fadeIn(3000, () => {
            $('.introBlurb2').html("and appeared in <span class='userNumBar2'></span><span class='userImgNumBar'></span>.<br>").promise().done(() => {
              $('.introBlurb2').fadeIn(4000, () => {
                $('.introBlurb3').html("Let's take a look at some of them.").promise().done(() => {
                  $('.introBlurb3').fadeIn(2000, () => {
                    $('.downArrow').fadeIn(500);
                  });
                });
              });
              counterControl($('.userNumBar2'), data[clientName].asSubject);
            });
          });
          counterControl($('.userNumBar1'), data[clientName].asPhototaker);
        });
      });
      counterControl($('.userNumBar0'), data.total);
    });
  });
};

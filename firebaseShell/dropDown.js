const DROPDOWN_NAMES_AND_COLORS = [
  { name: '2 year old', color: '#fc8638' },
  { name: 'Andrew', color: '#f7d038' },
  { name: 'Chimu', color: '#a3e048' },
  { name: 'Emily', color: '#49da9a' },
  { name: 'Jiu', color: '#08fcd8' },
  { name: 'Justin', color: '#34bbe6' },
  { name: 'Kat', color: '#8887f5' },
  { name: 'Shirley', color: '#d23be7' },
  { name: 'Victor', color: '#fa64d2' },
];

const YES_NO_COLORS = [
  { name: 'Yes', color: '#f748a2' },
  { name: 'No', color: '#a57df5' },
];

const getUnderlineColor = (name, nameAndColors) => {
  let color = '';
  nameAndColors.forEach((obj) => {
    if (name === obj.name) {
      color += obj.color;
    }
  });
  return color;
};

const fillDropDown = (dropDownDivName, namesAndColors) => {
  namesAndColors.forEach((obj) => {
    $(`.options-${dropDownDivName}`).append(() => {
      const value = obj.name === '2 year old'
        ? 'twoYearOld'
        : obj.name;
      return `<div class='option option-${dropDownDivName} ${value}'>${obj.name}</div>`;
    });
  });
};

const slideUpAnimation = (dropDownDivName) => {
  $(`.options-${dropDownDivName}`).slideUp(() => {
    $(`.dropDownBtn-${dropDownDivName}`).click(() => {
      const attr = $(`.dropDownBtn-${dropDownDivName}`).attr('clicked');
      const dropDownClicked = attr === 'true';
      if (dropDownClicked) {
        $(`.options-${dropDownDivName}`).slideUp('slow');
      } else {
        $(`.options-${dropDownDivName}`).slideDown('slow');
      }
      $(`.dropDownBtn-${dropDownDivName}`).attr('clicked', `${!dropDownClicked}`);
    });
  });
};

const clickChange = (dropDownDivName, namesAndColors) => {
  $(`.option-${dropDownDivName}`).click((e) => {
    const name = e.target.outerText;
    $(`.dropDownBtn-${dropDownDivName}`).html(name);
    $(`.options-${dropDownDivName}`).slideUp('slow');
    $(`.dropDownBtn-${dropDownDivName}`).attr('clicked', false);
    $(`.dropDownBtn-${dropDownDivName}`).css(
      { 'border-bottom': `2px solid ${getUnderlineColor(name, namesAndColors)}` },
    );
  });
};

const createDropDown = (dropDownDivName, namesAndColors) => {
  fillDropDown(dropDownDivName, namesAndColors);
  slideUpAnimation(dropDownDivName);
  clickChange(dropDownDivName, namesAndColors);
};

createDropDown('pw1', DROPDOWN_NAMES_AND_COLORS);
createDropDown('pw2', DROPDOWN_NAMES_AND_COLORS);
createDropDown('st1', DROPDOWN_NAMES_AND_COLORS);
createDropDown('st2', DROPDOWN_NAMES_AND_COLORS);
createDropDown('eric', YES_NO_COLORS);

const menuOpen = document.querySelector('#menu-open');
const menuClose = document.querySelector('#menu-close');
const menuPanel = document.querySelector('#menu-panel');
const menuOptions = {
    duration: 1400,
    easing: 'ease',
    fill: 'forwards',
};

menuOpen.addEventListener('click',() =>{
    //console.log('メニューを開く');
    menuPanel.animate({translate: ['100vw',0]},menuOptions);
    menuOpen.animate({opacity: [1,0]},menuOptions);
});

menuClose.addEventListener('click', () =>{
    menuPanel.animate({translate: [0,'100vw']},menuOptions);
    menuOpen.animate({opacity: [0,1]},menuOptions);
});

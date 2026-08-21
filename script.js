(function(){
  var root = document.documentElement;
  var theme = document.querySelector('#theme');
  var nav = document.querySelector('#nav');
  var menu = document.querySelector('#menu');
  var cursor = document.querySelector('#cursor');

  try {
    var saved = localStorage.getItem('techtivity-theme');
    if (saved === 'light' || saved === 'dark') {
      root.dataset.theme = saved;
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      root.dataset.theme = 'light';
    }
  } catch (e) {}
  syncThemeButton();

  theme.addEventListener('click', function(){
    var dark = root.dataset.theme === 'dark';
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('techtivity-theme', root.dataset.theme); } catch (e) {}
    syncThemeButton();
  });

  function syncThemeButton(){
    var isDark = root.dataset.theme === 'dark';
    theme.innerHTML = isDark ? '☼ <span>Light</span>' : '☾ <span>Dark</span>';
    theme.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  function closeMenu(){
    nav.classList.remove('open');
    menu.textContent = '☰';
    menu.setAttribute('aria-label', 'Open menu');
    menu.setAttribute('aria-expanded', 'false');
  }

  menu.addEventListener('click', function(){
    var open = nav.classList.toggle('open');
    menu.textContent = open ? '×' : '☰';
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-expanded', String(open));
  });

  nav.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', closeMenu);
  });

  window.addEventListener('pointermove', function(e){
    if (cursor) cursor.style.transform = 'translate3d(' + (e.clientX - 10) + 'px,' + (e.clientY - 10) + 'px,0)';
  });

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .14 });
    document.querySelectorAll('.reveal').forEach(function(el){ observer.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('show'); });
  }
})();

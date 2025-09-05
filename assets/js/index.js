document.addEventListener('DOMContentLoaded', () => {
  
  const animatedElements = document.querySelectorAll('.slide, .card, .fade-in-up, .services-container, .whenever-wherever-card, .download-app-section, .form-container');

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        
        if (entry.target.classList.contains('slide')) {
          entry.target.classList.add('in-view');
        }
        
        if (entry.target.classList.contains('card')) {
          const cardIndex = Array.from(document.querySelectorAll('.card')).indexOf(entry.target);
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, cardIndex * 150);
        }
        
        if (entry.target.classList.contains('fade-in-up')) {
          const itemIndex = Array.from(document.querySelectorAll('.fade-in-up')).indexOf(entry.target);
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, itemIndex * 100);
        }
        
        if (entry.target.classList.contains('services-container')) {
          const items = entry.target.querySelectorAll('.hidden-item');
          items.forEach((item, index) => {
            setTimeout(() => {
              item.classList.add('visible-item');
              item.classList.remove('hidden-item');
            }, index * 100);
          });
        }
        
        if (entry.target.classList.contains('whenever-wherever-card')) {
          const cardIndex = Array.from(document.querySelectorAll('.whenever-wherever-card')).indexOf(entry.target);
          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, cardIndex * 200);
        }
        
        if (entry.target.classList.contains('download-app-section')) {
          entry.target.classList.add('is-visible');
        }

        if (entry.target.classList.contains('form-container')) {
          entry.target.classList.add('visible');
        }

        
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 }); 

  animatedElements.forEach(el => observer.observe(el));

  
  const menu = document.getElementById('mobile-menu');
  const navMenu = document.querySelector('.nav-menu');
  menu.addEventListener('click', () => {
    menu.classList.toggle('is-active');
    navMenu.classList.toggle('active');
  });

  
  const nav = document.querySelector('.main-nav');
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    if (lastScrollY < window.scrollY && window.scrollY > 80) {
      
      nav.classList.add('nav-hidden');
    } else {
      
      nav.classList.remove('nav-hidden');
    }
    lastScrollY = window.scrollY;
  });
});
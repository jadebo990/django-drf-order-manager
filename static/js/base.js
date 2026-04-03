// aggiungo la classe 'active' al link della pagina corrente nel menu 
document.querySelectorAll('.nav-item a').forEach(pagina => {
    if(pagina.pathname === window.location.pathname){
        pagina.classList.add('active');
    }        
})
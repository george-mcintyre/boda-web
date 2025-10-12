// Biblioteca de iconos para eventos de boda
const EVENTOS_ICONS = {
  // Ceremonias y Religión
  "fas fa-church": "Iglesia",
  "fas fa-pray": "Oración",
  "fas fa-cross": "Cruz",
  "fas fa-dove": "Paloma de la paz",
  "fas fa-bible": "Biblia",
  "fas fa-praying-hands": "Manos rezando",
  "fas fa-angel": "Ángel",
  "fas fa-star-of-david": "Estrella de David",
  "fas fa-menorah": "Menorá",
  "fas fa-om": "Símbolo Om",
  "fas fa-yin-yang": "Yin Yang",
  
  // Celebración y Fiesta
  "fas fa-glass-cheers": "Brindis",
  "fas fa-champagne-glasses": "Copas de champán",
  "fas fa-wine-glass": "Copa de vino",
  "fas fa-cocktail": "Cóctel",
  "fas fa-birthday-cake": "Pastel",
  "fas fa-cake-candles": "Pastel con velas",
  "fas fa-gift": "Regalo",
  "fas fa-gifts": "Regalos",
  "fas fa-balloon": "Globo",
  "fas fa-confetti": "Confeti",
  "fas fa-fireworks": "Fuegos artificiales",
  "fas fa-sparkles": "Destellos",
  "fas fa-star": "Estrella",
  "fas fa-heart": "Corazón",
  "fas fa-hearts": "Corazones",
  
  // Música y Entretenimiento
  "fas fa-music": "Música",
  "fas fa-guitar": "Guitarra",
  "fas fa-piano": "Piano",
  "fas fa-violin": "Violín",
  "fas fa-drum": "Tambor",
  "fas fa-microphone": "Micrófono",
  "fas fa-headphones": "Auriculares",
  "fas fa-play": "Reproducir",
  "fas fa-pause": "Pausa",
  "fas fa-volume-high": "Volumen alto",
  "fas fa-dancing": "Baile",
  "fas fa-person-dancing": "Persona bailando",
  
  // Comida y Bebida
  "fas fa-utensils": "Cubiertos",
  "fas fa-fork-knife": "Tenedor y cuchillo",
  "fas fa-plate-wheat": "Plato con trigo",
  "fas fa-bread-slice": "Pan",
  "fas fa-cheese": "Queso",
  "fas fa-fish": "Pescado",
  "fas fa-drumstick-bite": "Pollo",
  "fas fa-carrot": "Zanahoria",
  "fas fa-apple-alt": "Manzana",
  "fas fa-lemon": "Limón",
  "fas fa-coffee": "Café",
  "fas fa-tea": "Té",
  "fas fa-mug-hot": "Taza caliente",
  "fas fa-ice-cream": "Helado",
  "fas fa-cookie": "Galleta",
  "fas fa-candy-cane": "Caramelo",
  
  // Decoración y Ambiente
  "fas fa-flower": "Flor",
  "fas fa-rose": "Rosa",
  "fas fa-tulip": "Tulipán",
  "fas fa-sunflower": "Girasol",
  "fas fa-lily": "Lirio",
  "fas fa-orchid": "Orquídea",
  "fas fa-bouquet": "Ramo",
  "fas fa-seedling": "Plántula",
  "fas fa-leaf": "Hoja",
  "fas fa-tree": "Árbol",
  "fas fa-candle": "Vela",
  "fas fa-fire": "Fuego",
  "fas fa-lightbulb": "Bombilla",
  "fas fa-lamp": "Lámpara",
  "fas fa-moon": "Luna",
  "fas fa-sun": "Sol",
  "fas fa-cloud": "Nube",
  "fas fa-rainbow": "Arcoíris",
  
  // Vestimenta y Accesorios
  "fas fa-tshirt": "Camiseta",
  "fas fa-user-tie": "Persona con corbata",
  "fas fa-user-dress": "Persona con vestido",
  "fas fa-hat-cowboy": "Sombrero",
  "fas fa-glasses": "Gafas",
  "fas fa-ring": "Anillo",
  "fas fa-ring-diamond": "Anillo con diamante",
  "fas fa-gem": "Gema",
  "fas fa-crown": "Corona",
  "fas fa-necklace": "Collar",
  "fas fa-earrings": "Pendientes",
  "fas fa-watch": "Reloj",
  "fas fa-shoe-prints": "Huellas de zapatos",
  "fas fa-bag-shopping": "Bolsa de compras",
  
  // Transporte y Ubicación
  "fas fa-car": "Coche",
  "fas fa-car-side": "Coche lateral",
  "fas fa-car-rear": "Coche trasero",
  "fas fa-taxi": "Taxi",
  "fas fa-bus": "Autobús",
  "fas fa-train": "Tren",
  "fas fa-plane": "Avión",
  "fas fa-ship": "Barco",
  "fas fa-helicopter": "Helicóptero",
  "fas fa-bicycle": "Bicicleta",
  "fas fa-motorcycle": "Motocicleta",
  "fas fa-map-marker-alt": "Marcador de mapa",
  "fas fa-map": "Mapa",
  "fas fa-compass": "Brújula",
  "fas fa-location-dot": "Punto de ubicación",
  "fas fa-route": "Ruta",
  "fas fa-directions": "Direcciones",
  
  // Tiempo y Calendario
  "fas fa-clock": "Reloj",
  "fas fa-calendar": "Calendario",
  "fas fa-calendar-day": "Día del calendario",
  "fas fa-calendar-week": "Semana del calendario",
  "fas fa-calendar-alt": "Calendario alternativo",
  "fas fa-calendar-check": "Calendario con check",
  "fas fa-calendar-plus": "Calendario con plus",
  "fas fa-calendar-minus": "Calendario con menos",
  "fas fa-calendar-times": "Calendario con X",
  "fas fa-hourglass": "Reloj de arena",
  "fas fa-hourglass-half": "Reloj de arena medio",
  "fas fa-hourglass-start": "Reloj de arena inicio",
  "fas fa-hourglass-end": "Reloj de arena fin",
  "fas fa-stopwatch": "Cronómetro",
  "fas fa-timer": "Temporizador",
  
  // Comunicación y Tecnología
  "fas fa-phone": "Teléfono",
  "fas fa-mobile-alt": "Móvil",
  "fas fa-envelope": "Sobre",
  "fas fa-envelope-open": "Sobre abierto",
  "fas fa-paper-plane": "Avión de papel",
  "fas fa-comment": "Comentario",
  "fas fa-comments": "Comentarios",
  "fas fa-phone-volume": "Teléfono con volumen",
  "fas fa-fax": "Fax",
  "fas fa-print": "Imprimir",
  "fas fa-camera": "Cámara",
  "fas fa-video": "Vídeo",
  "fas fa-tv": "Televisión",
  "fas fa-laptop": "Portátil",
  "fas fa-tablet": "Tablet",
  "fas fa-mobile": "Móvil",
  "fas fa-wifi": "WiFi",
  "fas fa-bluetooth": "Bluetooth",
  "fas fa-satellite": "Satélite",
  "fas fa-satellite-dish": "Antena parabólica",
  
  // Actividades y Deportes
  "fas fa-gamepad": "Mando de juego",
  "fas fa-dice": "Dado",
  "fas fa-chess": "Ajedrez",
  "fas fa-puzzle-piece": "Pieza de puzzle",
  "fas fa-bowling-ball": "Bola de bolos",
  "fas fa-golf-ball": "Pelota de golf",
  "fas fa-basketball": "Baloncesto",
  "fas fa-volleyball": "Voleibol",
  "fas fa-football": "Fútbol",
  "fas fa-baseball": "Béisbol",
  "fas fa-tennis": "Tenis",
  "fas fa-swimming-pool": "Piscina",
  "fas fa-skiing": "Esquí",
  "fas fa-snowboarding": "Snowboard",
  "fas fa-hiking": "Senderismo",
  "fas fa-camping": "Camping",
  "fas fa-fishing": "Pesca",
  "fas fa-hunting": "Caza",
  "fas fa-running": "Correr",
  "fas fa-walking": "Caminar",
  "fas fa-biking": "Ciclismo",
  
  // Naturaleza y Aire Libre
  "fas fa-mountain": "Montaña",
  "fas fa-hill": "Colina",
  "fas fa-water": "Agua",
  "fas fa-ocean": "Océano",
  "fas fa-beach": "Playa",
  "fas fa-island": "Isla",
  "fas fa-forest": "Bosque",
  "fas fa-cactus": "Cactus",
  "fas fa-seedling": "Plántula",
  "fas fa-sprout": "Brote",
  "fas fa-bug": "Bicho",
  "fas fa-butterfly": "Mariposa",
  "fas fa-bee": "Abeja",
  "fas fa-bird": "Pájaro",
  "fas fa-cat": "Gato",
  "fas fa-dog": "Perro",
  "fas fa-horse": "Caballo",
  "fas fa-fish": "Pez",
  "fas fa-dragon": "Dragón",
  "fas fa-unicorn": "Unicornio",
  
  // Emociones y Estados
  "fas fa-smile": "Sonrisa",
  "fas fa-laugh": "Risa",
  "fas fa-grin": "Sonrisa amplia",
  "fas fa-grin-stars": "Sonrisa con estrellas",
  "fas fa-grin-hearts": "Sonrisa con corazones",
  "fas fa-grin-tears": "Sonrisa con lágrimas",
  "fas fa-grin-tongue": "Sonrisa con lengua",
  "fas fa-grin-wink": "Sonrisa con guiño",
  "fas fa-grin-squint": "Sonrisa entrecerrando ojos",
  "fas fa-grin-squint-tears": "Sonrisa entrecerrando ojos con lágrimas",
  "fas fa-meh": "Meh",
  "fas fa-frown": "Cara triste",
  "fas fa-sad-tear": "Lágrima triste",
  "fas fa-angry": "Enfadado",
  "fas fa-tired": "Cansado",
  "fas fa-dizzy": "Mareado",
  "fas fa-surprise": "Sorpresa",
  "fas fa-shocked": "Sorprendido",
  "fas fa-flushed": "Ruborizado",
  "fas fa-sweat": "Sudor",
  "fas fa-hot": "Caliente",
  "fas fa-cold": "Frío",
  "fas fa-sick": "Enfermo",
  "fas fa-mask": "Máscara",
  "fas fa-theater-masks": "Máscaras de teatro",
  
  // Objetos y Herramientas
  "fas fa-tools": "Herramientas",
  "fas fa-wrench": "Llave inglesa",
  "fas fa-screwdriver": "Destornillador",
  "fas fa-hammer": "Martillo",
  "fas fa-saw": "Sierra",
  "fas fa-drill": "Taladro",
  "fas fa-paint-brush": "Pincel",
  "fas fa-palette": "Paleta",
  "fas fa-pencil": "Lápiz",
  "fas fa-pen": "Bolígrafo",
  "fas fa-marker": "Marcador",
  "fas fa-highlighter": "Resaltador",
  "fas fa-chalkboard": "Pizarra",
  "fas fa-chalkboard-teacher": "Pizarra con profesor",
  "fas fa-book": "Libro",
  "fas fa-book-open": "Libro abierto",
  "fas fa-newspaper": "Periódico",
  "fas fa-magazine": "Revista",
  "fas fa-scroll": "Pergamino",
  "fas fa-file": "Archivo",
  "fas fa-folder": "Carpeta",
  "fas fa-briefcase": "Maletín",
  "fas fa-suitcase": "Maleta",
  "fas fa-backpack": "Mochila",
  "fas fa-umbrella": "Paraguas",
  "fas fa-umbrella-beach": "Sombrilla de playa",
  "fas fa-sun-umbrella": "Sombrilla de sol",
  "fas fa-tent": "Tienda de campaña",
  "fas fa-campground": "Camping",
  "fas fa-rv": "Caravana",
  "fas fa-truck": "Camión",
  "fas fa-truck-pickup": "Camión pickup",
  "fas fa-truck-moving": "Camión en movimiento",
  "fas fa-truck-loading": "Camión cargando",
  "fas fa-truck-delivery": "Camión entregando",
  "fas fa-shipping-fast": "Envío rápido",
  "fas fa-shipping-timed": "Envío programado",
  "fas fa-box": "Caja",
  "fas fa-boxes": "Cajas",
  "fas fa-box-open": "Caja abierta",
  "fas fa-archive": "Archivo",
  "fas fa-dolly": "Carretilla",
  "fas fa-dolly-flatbed": "Carretilla plana",
  "fas fa-pallet": "Palé",
  "fas fa-warehouse": "Almacén",
  "fas fa-industry": "Industria",
  "fas fa-factory": "Fábrica",
  "fas fa-store": "Tienda",
  "fas fa-shopping-cart": "Carrito de compras",
  "fas fa-cash-register": "Caja registradora",
  "fas fa-credit-card": "Tarjeta de crédito",
  "fas fa-money-bill": "Billete",
  "fas fa-coins": "Monedas",
  "fas fa-piggy-bank": "Hucha",
  "fas fa-chart-line": "Gráfico de línea",
  "fas fa-chart-bar": "Gráfico de barras",
  "fas fa-chart-pie": "Gráfico circular",
  "fas fa-chart-area": "Gráfico de área",
  "fas fa-percentage": "Porcentaje",
  "fas fa-calculator": "Calculadora",
  "fas fa-abacus": "Ábaco",
  "fas fa-scale-balanced": "Balanza",
  "fas fa-weight-scale": "Báscula",
  "fas fa-ruler": "Regla",
  "fas fa-ruler-combined": "Regla combinada",
  "fas fa-ruler-horizontal": "Regla horizontal",
  "fas fa-ruler-vertical": "Regla vertical",
  "fas fa-tape": "Cinta métrica",
  "fas fa-tachometer-alt": "Tacómetro",
  "fas fa-speedometer": "Velocímetro",
  "fas fa-thermometer": "Termómetro",
  "fas fa-thermometer-half": "Termómetro medio",
  "fas fa-thermometer-quarter": "Termómetro cuarto",
  "fas fa-thermometer-empty": "Termómetro vacío",
  "fas fa-thermometer-full": "Termómetro lleno",
  "fas fa-thermometer-three-quarters": "Termómetro tres cuartos",
  "fas fa-thermometer-half": "Termómetro medio",
  "fas fa-thermometer-quarter": "Termómetro cuarto",
  "fas fa-thermometer-empty": "Termómetro vacío",
  "fas fa-thermometer-full": "Termómetro lleno",
  "fas fa-thermometer-three-quarters": "Termómetro tres cuartos",
  "fas fa-thermometer-half": "Termómetro medio",
  "fas fa-thermometer-quarter": "Termómetro cuarto",
  "fas fa-thermometer-empty": "Termómetro vacío",
  "fas fa-thermometer-full": "Termómetro lleno",
  "fas fa-thermometer-three-quarters": "Termómetro tres cuartos"
};

// Categorías de iconos para facilitar la búsqueda
const ICON_CATEGORIES = {
  "Ceremonias": [
    "fas fa-church", "fas fa-pray", "fas fa-cross", "fas fa-dove", 
    "fas fa-bible", "fas fa-praying-hands", "fas fa-angel"
  ],
  "Celebración": [
    "fas fa-glass-cheers", "fas fa-champagne-glasses", "fas fa-wine-glass",
    "fas fa-cocktail", "fas fa-birthday-cake", "fas fa-gift", "fas fa-balloon"
  ],
  "Música": [
    "fas fa-music", "fas fa-guitar", "fas fa-piano", "fas fa-violin",
    "fas fa-microphone", "fas fa-dancing"
  ],
  "Comida": [
    "fas fa-utensils", "fas fa-fork-knife", "fas fa-plate-wheat",
    "fas fa-bread-slice", "fas fa-cheese", "fas fa-fish"
  ],
  "Decoración": [
    "fas fa-flower", "fas fa-rose", "fas fa-tulip", "fas fa-bouquet",
    "fas fa-candle", "fas fa-lightbulb", "fas fa-moon"
  ],
  "Transporte": [
    "fas fa-car", "fas fa-taxi", "fas fa-bus", "fas fa-train",
    "fas fa-plane", "fas fa-map-marker-alt"
  ],
  "Tiempo": [
    "fas fa-clock", "fas fa-calendar", "fas fa-calendar-day",
    "fas fa-hourglass", "fas fa-stopwatch"
  ]
};

// Funciones para trabajar con los iconos
function getAllEventIcons() {
  return EVENTOS_ICONS;
}

function getIconsByCategory(category) {
  return ICON_CATEGORIES[category] || [];
}

function searchIcons(searchText) {
  const results = {};
  const searchLower = searchText.toLowerCase();
  
  Object.entries(EVENTOS_ICONS).forEach(([iconClass, description]) => {
    if (description.toLowerCase().includes(searchLower) || 
        iconClass.toLowerCase().includes(searchLower)) {
      results[iconClass] = description;
    }
  });
  
  return results;
}

function getIconDescription(iconClass) {
  return EVENTOS_ICONS[iconClass] || "Icono no encontrado";
}

function getCategories() {
  return Object.keys(ICON_CATEGORIES);
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EVENTOS_ICONS,
    ICON_CATEGORIES,
    getAllEventIcons,
    getIconsByCategory,
    searchIcons,
    getIconDescription,
    getCategories
  };
}

const FIGURINE_AMOUNT_OPTIONS = [250, 500];

const FIGURINES = [
  {
    id: 1,
    key: 'bride',
    title: {
      en: 'The Bride',
      es: 'La Novia',
      fr: 'La Mariée',
      de: 'Die Braut',
    },
    description: {
      en: 'A 3D figurine of the bride in her wedding finery — destined to perch atop the wedding cake and live forever as part of the sculpture afterwards. Includes a printed gift note you can sign on the day. The closest you\'ll get to making her stand still long enough for a portrait. (Placeholder description — final art forthcoming.)',
      es: 'Una figurita 3D de la novia con sus mejores galas nupciales — destinada a coronar la tarta de boda y a vivir para siempre como parte de la escultura después. Incluye una nota de regalo impresa que podrás firmar el día de la boda. Lo más parecido a conseguir que se quede quieta para un retrato. (Descripción provisional — el diseño final está por llegar.)',
      fr: 'Une figurine 3D de la mariée dans ses plus beaux atours — destinée à trôner au sommet de la pièce montée et à vivre pour toujours dans la sculpture par la suite. Comprend un mot d\'accompagnement imprimé à signer le jour J. Ce qu\'on aura de plus proche d\'un portrait où elle reste immobile. (Description provisoire — le rendu final arrive.)',
      de: 'Eine 3D-Figur der Braut in vollem Hochzeitsstaat — bestimmt dafür, die Hochzeitstorte zu krönen und danach für immer als Teil der Skulptur weiterzuleben. Inklusive einer gedruckten Geschenkkarte zum Unterschreiben am Tag selbst. So nah wird man ihr nie kommen, um sie für ein Porträt stillstehen zu lassen. (Platzhalter-Beschreibung — der finale Entwurf folgt.)',
    },
  },
  {
    id: 2,
    key: 'groom',
    title: {
      en: 'The Groom',
      es: 'El Novio',
      fr: 'Le Marié',
      de: 'Der Bräutigam',
    },
    description: {
      en: 'A 3D figurine of the groom — sharp suit, faint smirk, ready to claim his half of the wedding cake. Will adorn the cake on the day, then settle in permanently as part of the sculpture. Comes with a printed gift note you can add to before handing it over. (Placeholder description — final art forthcoming.)',
      es: 'Una figurita 3D del novio — traje impecable, leve sonrisa de medio lado, listo para reclamar su mitad de la tarta. Adornará la tarta el día de la boda y luego se instalará para siempre como parte de la escultura. Incluye una nota de regalo impresa a la que podrás añadir tu mensaje antes de entregarla. (Descripción provisional — el diseño final está por llegar.)',
      fr: 'Une figurine 3D du marié — costume impeccable, léger sourire en coin, prêt à réclamer sa moitié du gâteau. Trônera sur la pièce montée le jour J, puis s\'installera définitivement dans la sculpture. Vendue avec un mot d\'accompagnement imprimé à compléter avant de la remettre. (Description provisoire — le rendu final arrive.)',
      de: 'Eine 3D-Figur des Bräutigams — scharfer Anzug, leises Schmunzeln, bereit, seine Hälfte der Torte zu beanspruchen. Krönt am Hochzeitstag die Torte und nimmt danach dauerhaft Platz in der Skulptur. Mit einer gedruckten Geschenkkarte, die du vor der Übergabe ergänzen kannst. (Platzhalter-Beschreibung — der finale Entwurf folgt.)',
    },
  },
  {
    id: 3,
    key: 'bride-lounger',
    title: {
      en: 'The Bride on a Sun-Lounger',
      es: 'La Novia en una Tumbona',
      fr: 'La Mariée sur un Transat',
      de: 'Die Braut auf einer Sonnenliege',
    },
    description: {
      en: 'A 3D figurine of the bride on a sun-lounger — because the wedding sculpture deserves a holiday version too. Honeymoon-energy in physical form. Will join the cake, then the sculpture, and quietly judge anyone wearing socks with sandals. (Placeholder description — final art forthcoming.)',
      es: 'Una figurita 3D de la novia en una tumbona — porque la escultura de boda también se merece una versión de vacaciones. La energía de la luna de miel hecha objeto. Se unirá a la tarta, luego a la escultura, y juzgará en silencio a quien lleve calcetines con sandalias. (Descripción provisional — el diseño final está por llegar.)',
      fr: 'Une figurine 3D de la mariée sur un transat — parce que la sculpture de mariage mérite aussi sa version vacances. L\'énergie lune de miel en version physique. Rejoindra le gâteau, puis la sculpture, et jugera discrètement quiconque porte des chaussettes avec des sandales. (Description provisoire — le rendu final arrive.)',
      de: 'Eine 3D-Figur der Braut auf einer Sonnenliege — denn die Hochzeitsskulptur hat auch eine Urlaubsversion verdient. Flitterwochen-Energie in physischer Form. Wird zur Torte stoßen, dann zur Skulptur, und still über jeden urteilen, der Socken in Sandalen trägt. (Platzhalter-Beschreibung — der finale Entwurf folgt.)',
    },
  },
  {
    id: 4,
    key: 'groom-lounger',
    title: {
      en: 'The Groom on a Sun-Lounger',
      es: 'El Novio en una Tumbona',
      fr: 'Le Marié sur un Transat',
      de: 'Der Bräutigam auf einer Sonnenliege',
    },
    description: {
      en: 'A 3D figurine of the groom on a sun-lounger — beverage in hand, no further plans for the day. The off-duty companion piece. Cake first, sculpture forever, dignity entirely optional. (Placeholder description — final art forthcoming.)',
      es: 'Una figurita 3D del novio en una tumbona — bebida en mano, sin más planes por ese día. La pieza compañera en modo "fuera de servicio". Primero la tarta, después la escultura para siempre, la dignidad totalmente opcional. (Descripción provisional — el diseño final está por llegar.)',
      fr: 'Une figurine 3D du marié sur un transat — boisson à la main, plus aucun projet pour la journée. La pièce compagne en mode "off". D\'abord le gâteau, ensuite la sculpture pour toujours, dignité entièrement facultative. (Description provisoire — le rendu final arrive.)',
      de: 'Eine 3D-Figur des Bräutigams auf einer Sonnenliege — Getränk in der Hand, keine weiteren Pläne für den Tag. Das Pendant im Feierabend-Modus. Erst die Torte, dann ewig die Skulptur, Würde völlig optional. (Platzhalter-Beschreibung — der finale Entwurf folgt.)',
    },
  },
];

module.exports = { FIGURINES, FIGURINE_AMOUNT_OPTIONS };

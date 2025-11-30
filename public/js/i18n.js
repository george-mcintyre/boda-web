// Static translations
const translations = {
  en: {
    'common:days': 'Days',
    'common:hours': 'Hours',
    'common:minutes': 'Minutes',
    'common:seconds': 'Seconds',
    'common:login': 'Login',
    'common:footer': '© 2026 Boda de Iluminada &amp; George',
    'common:noEmail': 'no email',

    'common:primary': 'Primary',
    'common:saving': 'Saving...',
    'common:menuSelectionsSaved': 'Menu selections saved successfully!',
    'common:errorSavingMenuSelections': 'Error saving menu selections',
    'common:menuSelectionSaved': 'Menu selection saved successfully!',
    'common:errorSavingMenuSelection': 'Error saving menu selection',
    'common:specialRequestSaved': 'Special request saved successfully!',
    'common:errorSavingSpecialRequest': 'Error saving special request',
    'common:specialRequestDetailsSaved': 'Special request details saved successfully!',
    'common:errorSavingSpecialRequestDetails': 'Error saving special request details',
    'common:People': 'people',
    'common:Person': 'person',
 
    'wedding:title': 'Iluminada & George',
    'wedding:subtitle': 'We\'re getting married!',
    'wedding:date': 'June 6th, 2026 • Marbella, Spain',
    'wedding:hero.description': 'Iluminada and George are getting married on the beach in Marbella this June, and we’re so happy to share it with you. Expect sun, sea and lots of laughter.',
    'wedding:hero.description2': 'This site is your wedding hub. Log in with your RSVP email to confirm your party, choose your menu, see the schedule, view our gift list and chat with other guests.',

    'wedding:guestZone.title': 'Guest Zone',
    'wedding:guestZone.description': 'Here you can manage all the details of your participation in our wedding.',

    'login:pageTitle': 'Guest access - Wedding',
    'login:header': 'Guest access',
    'login:home': 'Home',
    'login:emailLabel': 'Email:',
    'login:emailPlaceholder': 'Enter your email',
    'login:submit': 'Continue',
    'login:enterEmail': 'Please enter your email.',
    'login:successRedirect': 'Login successful. Redirecting...',
    'login:emailNotFound': 'Email not found in the guest list',
    'login:serverError': 'Server connection error',

    'guests:title': 'Guest Zone - Iluminada & George Wedding',
    'guests:welcomeTitle': 'Guest Zone',
    'guests:tabSummary': 'Summary',
    'guests:tabMenu': 'Menu',
    'guests:tabAgenda': 'Agenda',
    'guests:tabRSVP': 'RSVP',
    'guests:tabGifts': 'Gifts',
    'guests:menuSelection': 'Menu Selection',
    'guests:menuSelectionDesc': 'Your current menu selection for our wedding.',
    'guests:menuSelectionDesc2': 'Choose your preferred dishes for our wedding.',
    'guests:tabParty': 'Party',
    'guests:yourSummary': 'Your Summary',

    // Summary Page
    'guests:summaryPageTitle': 'Your guest area for Iluminada & George\'s wedding',
    'rich:guests:summaryPageDescription': `
      <p>
        Welcome to your personal space for Iluminada &amp; George\'s wedding. 
        From here you can share in the planning, keep your details up to date, 
        and help us make the celebration feel just right for you and your party.
      </p>
      <p>
        In this area you can update the names of everyone in your party, tell us about any food allergies 
        or special dietary needs, confirm who will attend each of the wedding events, 
        choose your preferred courses and drinks for the banquet, send messages to other guests 
        and, if you wish, select a gift for us from the wedding registry.  
        We\'re so happy to be celebrating this with you. ❤️
      </p>
    `,
    'guests:summaryYourParty': 'Your Party',
    'guests:summaryRSVP': 'RSVP Summary',
    'guests:summaryMenuSelections': 'Menu Selections',

    'guests:loadingPartyMembers': 'Loading party members...',
    'guests:loadingComments': 'Loading comments...',
    'guests:partyManagement': 'Party Management',
    'rich:guests:partyManagementDesc': 'Manage your wedding party members and their dietary requirements.',
    'guests:giftsSelection': 'Gifts Selection',
    'rich:guests:giftsSelectionDesc': 'Choose your favorite gifts for our wedding celebrations.',
    'guests:eventsRSVP': 'RSVP',
    'rich:guests:eventsRSVPDesc': 'The celebrations will take place over three days: Friday, Saturday and Sunday. They kick off on Friday with a welcome dinner.   Saturday is a full day of activities including the wedding ceremony, the reception banquet, and dancing.   Sunday\'s activities include a farewell brunch.  Please confirm your attendance for which ever of these events you will be attending.',

    // Party Page
    'guests:partyPageTitle': 'Party Management',
    'guests:partyPageDescription': 'Manage your wedding party members and their dietary requirements.',

    // Events Page
    'guests:eventsPageTitle': 'RSVP to the Wedding Events below',
    'guests:eventsPageDescription': 'We are thrilled to have to have you join us for the wedding. Here are the details of all the events that will be taking place. Please select your name in each event in the Who\'s Attending section. That way we can prepare everything for you to have a great time.',
    'guests:eventAgenda': 'Event Agenda',
    'guests:eventsLoading': 'Loading events...',
    'guests:eventsNoEvents': 'No Events Available',
    'guests:eventsNoEventsDescription': 'There are no events scheduled yet. Please check back later.',
    'guests:eventsNoPartyMembers': 'No party members found.',
    'guests:eventsViewOnMap': 'View on Map',
    'guests:eventsWhosAttending': 'Who\'s Attending?',
    'guests:eventsErrorTitle': 'Error Loading Events',
    'guests:eventsErrorMessage': 'There was a problem loading the events. Please try again.',
    'guests:eventsSchedule': 'Schedule',
    'guests:childBadge': 'Child',
    'guests:eventsAttendanceSavedSuccess': 'Attendance choices saved successfully!',
    'guests:eventsAttendanceSavedError': 'Error saving attendance choices',
    'guests:eventsSaveAttendanceChoices': 'Save Attendance Choices',
    'guests:eventAgendaDesc': 'Your attendance confirmations for our wedding events.',
    'guests:eventAgendaDesc2': 'Confirm your attendance to each of our wedding events.',
    'guests:eventRSVP': 'RSVP',
    'guests:eventRSVPSummary': 'Your attendance confirmations for our wedding events.',
    'guests:eventRSVPDesc': 'The celebrations will take place over three days: Friday, Saturday and Sunday. They kick off on Friday with a welcome dinner.   Saturday is a full day of activities including the wedding ceremony, the reception banquet, and dancing.   Sunday\'s activities include a farewell brunch.  Please confirm your attendance for which ever of these events you will be attending.',
    'guests:giftList': 'Gift List',
    'guests:giftListDesc': 'Your reserved gifts from our wish list.',
    'guests:giftListDesc2': 'If you want to give us a gift, here is our wish list. You can reserve any gift you like.',
    'guests:logout': 'Logout',
    'guests:backToHome': 'Back to home',
    'guests:confirmed': 'Confirmed',
    'guests:pending': 'Pending',
    'guests:event': 'Event',
    'guests:reserved': 'Reserved',

    // Menu Page
    'guests:menuPageTitle': 'Menu Selection',
    'guests:menuPageDescription': 'Choose your preferred dishes for the wedding banquet.',
    'guests:currentSelection': 'Your current selection',
    'guests:starter': 'Starter:',
    'guests:mainCourse': 'Main course:',
    'guests:dessert': 'Dessert:',
    'guests:specialOption': 'Special option:',
    'guests:allergies': 'Allergies:',
    'guests:notSelected': 'Not selected',
    'guests:selectionStatus': 'Selection status',
    'guests:noSelectionYet': 'You haven\'t made your menu selection yet. Click the button above to start.',
    'guests:eventConfirmations': 'Your event confirmations',
    'guests:noEventConfirmations': 'You haven\'t confirmed attendance to any events yet.',
    'guests:giftReservations': 'Your reserved gifts',
    'guests:noGiftReservations': 'You haven\'t reserved any gifts from our list yet.',
    'guests:confirmAction': 'Confirm action',
    'guests:commentsTitle': 'Comments',
    'rich:guests:commentsSubtitle': 'Share your thoughts with other guests',
    'rich:guests:commentPlaceholder': `
      <textarea
        id="newComment"
        name="comment"
        placeholder="Write your comment..."
        rows="3"
        maxlength="500"
      ></textarea>
     `,
    'guests:postComment': 'Post',
    'guests:noComments': 'No comments yet. Be the first to comment!',
    'guests:commentPosted': 'Comment posted successfully',
    'guests:commentDeleted': 'Comment deleted successfully',
    'guests:deleteCommentConfirm': 'Are you sure you want to delete this comment?',
    'guests:cancel': 'Cancel',
    'guests:confirm': 'Confirm',
    'guests:errorLoadingMenu': 'Error loading menu status:',
    'guests:errorConnection': 'Server connection error.',
    'guests:welcome': 'Welcome',
    'guests:welcomePersonalized': 'Welcome',
    'guests:menuSaved': 'Menu saved successfully',
    
    // Menu Selection Page
    'guests:menuLoading': 'Loading menu...',
    'guests:menuErrorTitle': 'Error Loading Menu',
    'guests:menuErrorMessage': 'Unable to load menu data. Please try again later.',
    'guests:menuErrorMessage2': 'There was a problem loading the menu. Please try again.',
    'guests:retry': 'Retry',
    'guests:courseGroupStarters': 'Starters',
    'guests:courseGroupMainCourses': 'Main Courses',
    'guests:courseGroupDesserts': 'Desserts',
    'guests:courseGroupDrinks': 'Drinks',
    'guests:selectionRequired': 'Selection Required',
    'guests:infoOnly': 'Info Only',
    'guests:whosHavingThis': 'Who\'s having this?',
    'guests:selectedCount': 'selected',
    'guests:dietaryRequirementsTitle': 'Dietary Requirements & Special Requests',
    'guests:dietaryRequirementsDescription': 'Please let us know about any dietary requirements or allergies for each guest.',
    'guests:dietaryVegetarian': 'Vegetarian',
    'guests:dietaryLactoseIntolerant': 'Lactose Intolerant',
    'guests:dietaryGlutenIntolerant': 'Gluten Intolerant',
    'guests:dietaryNutAllergy': 'Nut Allergy',
    'guests:dietaryOther': 'Other',
    'guests:additionalDetailsLabel': 'Additional details or specific requirements:',
    'guests:saveMenuSelections': 'Save Menu Selections',
    
    'common:home': 'Home',

    // Gifts Page
    'guests:giftsPageTitle': 'Gifts list',
    'guests:giftsPageDescription': 'Your presence is our gift. But if you want to contribute to our honeymoon you can choose an amusing gift from the list below and it will be printed with your message and displayed on a big wall at the wedding banquet.  The cash amount you choose will be used to fund our honeymoon.  Thank you',
    'guests:giftsLoading': 'Loading gifts...',
    'guests:giftsThankYouTitle': 'Thank You for Your Generosity!',
    'guests:giftsThankYouMessage': 'We are so grateful for your wonderful gifts',
    'rich:guests:giftsDonatedOn': 'Donated on {{date}}',
    'guests:giftsRegistryTitle': 'Gift Registry',
    'guests:giftsRegistrySubtitle': 'Choose from our carefully selected gifts',
    'guests:giftsNoAvailable': 'No gifts available',
    'guests:giftsNoAvailableDescription': 'Please check back later for our gift registry.',
    'guests:giftsAvailable': 'available',
    'guests:giftsSoldOut': 'Sold Out',
    'guests:giftsBuyGift': 'Buy Gift',
    'guests:giftsPaymentSuccess': 'Thank you for your gift! Your payment was successful.',
    'guests:giftsPaymentCancelled': 'Payment was cancelled.',
    'guests:giftsErrorLoading': 'Error Loading Gifts',
    'guests:giftsErrorLoadingDescription': 'There was a problem loading the gifts. Please try again.',
    'guests:giftsRetry': 'Retry',
    'guests:giftsPurchaseTitle': 'Purchase Gift',
    'guests:giftsPurchaseAbout': 'You\'re about to purchase:',
    'guests:giftsPurchaseMessageLabel': 'Add a personal message (optional):',
    'guests:giftsPurchaseMessagePlaceholder': 'Leave a lovely message for the couple...',
    'guests:giftsPurchaseCancel': 'Cancel',
    'guests:giftsPurchaseProceed': 'Proceed to Payment',
    'guests:giftsPurchaseProcessing': 'Processing...',
    'guests:giftsPaymentError': 'Error processing payment',
    'guests:giftsPaymentServiceError': 'Error connecting to payment service',
    'guests:tabCash': 'Gifts',
    'guests:cashGifts': 'Gifts',
    'guests:cashGiftsDesc': 'If you prefer to give a cash gift, you can choose a fixed or custom amount. Your generosity will help us start our new life together.',
    'guests:cashGiftsSummaryDesc': 'Your cash gifts made for our wedding.',
    'guests:cashGiftsSummary': 'Cash Gifts Summary',
    'guests:totalAmount': 'Total amount:',
    'guests:giftCount': 'Number of gifts:',
    'guests:lastGift': 'Last gift:',
    'guests:noCashGifts': 'You haven\'t made any cash gifts yet.',
    'guests:giftDate': 'Gift date:',
    'guests:giftMessage': 'Message:',
    'guests:giftHistory': 'Gift History',
    'guests:smallGift': 'Small gift',
    'guests:mediumGift': 'Medium gift',
    'guests:generousGift': 'Generous gift',
    'guests:specialGift': 'Special gift',
    'guests:donorInfo': 'Your Information',
    'guests:donorName': 'Full name',
    'guests:donorEmail': 'Email',
    'guests:donorMessage': 'Message for the couple (optional)',
    'guests:messagePlaceholder': 'Write a special message for Iluminada and George...',
    'guests:paymentSummary': 'Gift Summary',
    'guests:proceedPayment': 'Proceed to Payment',
    'guests:selectAmount': 'Please select an amount',
    'guests:fillRequired': 'Please fill in all required fields',
    'guests:processing': 'Processing payment...',
    'guests:error': 'Error processing payment',

    // Admin
    'admin:pageTitle': 'Admin Panel - Wedding of Iluminada & George',
    'admin:title': 'Admin Panel',
    'admin:home': 'Home',
    'admin:logout': 'Log out',
    'admin:welcomeTitle': 'Welcome, Administrator',
    'admin:welcomeDesc': 'Manage all wedding information for Iluminada and George',
    'admin:tab.guests': 'Guests',
    'admin:tab.gifts': 'Gift List',
    'admin:tab.messages': 'Messages',
    'admin:tab.events': 'Event Schedule',
    'admin:tab.menus': 'Menu Management',
    'admin:tab.settings': 'Settings',
    'admin:loading': 'Loading...',
    'admin:loadingGuests': 'Loading guests...',
    'admin:uploadingGuests': 'Uploading guests...',
    'admin:loadingPartyMembers': 'Loading party members...',
    'admin:loadingGiftList': 'Loading gift list...',
    'admin:loadingMessages': 'Loading messages...',
    'admin:loadingEventSchedule': 'Loading event schedule...',
    'admin:loadingCourses': 'Loading courses...',
    'admin:loadingSettings': 'Loading settings...',
    'admin:footer': 'Admin panel',

    // Admin Guests Section
    'admin:guests.errorLoading': 'Failed to load guests',
    'admin:guests.adult': 'Adult',
    'admin:guests.child': 'Child',
    'admin:guests.totalGuests': 'Total Guests',
    'admin:guests.acrossParties': 'Across {{count}} {{partyWord}}',
    'admin:guests.addGuest': 'Add Guest',
    'admin:guests.bulkUploadCsv': 'Bulk Upload CSV',
    'admin:guests.table.name': 'Name',
    'admin:guests.table.email': 'Email',
    'admin:guests.table.ageCategory': 'Age Category',
    'admin:guests.table.partySize': 'Party Size',
    'admin:guests.table.actions': 'Actions',
    'admin:guests.confirmDelete': 'Delete this guest and their entire party?',
    'admin:guests.editTitle': 'Edit guest',
    'admin:guests.addTitle': 'Add guest',
    'admin:guests.save': 'Save',
    'admin:guests.add': 'Add',
    'admin:guests.field.name': 'Name',
    'admin:guests.field.email': 'Email',
    'admin:guests.field.ageCategory': 'Age Category',
    'admin:guests.option.adult': 'Adult (18+)',
    'admin:guests.option.child': 'Child (Under 18)',
    'admin:guests.csv.noValidGuests': 'No valid guests found in CSV file',
    'admin:guests.csv.uploadCount': 'Upload {{count}} guests?',
    'admin:guests.csv.preview': 'Preview:',
    'admin:guests.csv.more': '... and {{count}} more',
    'admin:guests.csv.uploadComplete': 'Upload complete!',
    'admin:guests.csv.successCreated': 'Successfully created: {{count}}',
    'admin:guests.csv.skippedDuplicates': 'Skipped (duplicates/empty): {{count}}',
    'admin:guests.csv.errors': 'Errors: {{count}}',
    'admin:guests.csv.firstError': 'First error: {{error}}',
    'admin:guests.csv.uploadingError': 'Error uploading CSV: {{error}}',
    'admin:guests.error.title': 'Error Loading Guests',
    'admin:guests.error.failed': 'Failed to load guests: {{error}}',
    'admin:guests.retry': 'Retry',

    // Admin Gifts Section
    'admin:gifts.title': 'Gift List',
    'admin:gifts.add': 'Add',
    'admin:gifts.edit': 'Edit gift',
    'admin:gifts.save': 'Save',
    'admin:gifts.deleteConfirm': 'Delete this gift?',
    'admin:gifts.noImage': 'No image',
    'admin:gifts.grandTotal': 'Grand Total',
    'admin:gifts.grandTotalDescription': 'The available cards x price',
    'admin:gifts.table.name': 'Name',
    'admin:gifts.table.description': 'Description',
    'admin:gifts.table.image': 'Image',
    'admin:gifts.table.available': 'Available',
    'admin:gifts.table.price': 'Price',
    'admin:gifts.table.purchased': 'Purchased',
    'admin:gifts.table.actions': 'Actions',
    'admin:gifts.field.name': 'Name',
    'admin:gifts.field.description': 'Description',
    'admin:gifts.field.image': 'Image',
    'admin:gifts.field.available': 'Number Available',
    'admin:gifts.field.price': 'Price',
    'admin:gifts.field.imageHelp': 'Upload gift card image (will be stored in database)',
    'admin:gifts.priceOption.25': '€25',
    'admin:gifts.priceOption.50': '€50',
    'admin:gifts.priceOption.100': '€100',
    'admin:gifts.priceOption.200': '€200',
    'admin:gifts.priceOption.500': '€500',

    // Admin Party Management Section
    'admin:party.title': 'Manage Party: ',
    'admin:party.description': 'Manage party members for this guest',
    'admin:party.backToGuests': 'Back to Guests',
    'admin:party.primaryGuest': 'Primary Guest',
    'admin:party.unknown': 'Unknown',
    'admin:party.adult': 'Adult',
    'admin:party.child': 'Child',
    'admin:party.partyMembers': 'Party Members',
    'admin:party.addMember': 'Add Member',
    'admin:party.noMembers': 'No party members added yet.',
    'admin:party.table.name': 'Name',
    'admin:party.table.ageGroup': 'Age Group',
    'admin:party.table.actions': 'Actions',
    'admin:party.addModalTitle': 'Add Party Member',
    'admin:party.add': 'Add',
    'admin:party.field.name': 'Name',
    'admin:party.field.ageGroup': 'Age Group',
    'admin:party.option.adult': 'Adult (18+)',
    'admin:party.option.child': 'Child (Under 18)',
    'admin:party.editModalTitle': 'Edit Party Member',
    'admin:party.save': 'Save',
    'admin:party.confirmRemove': 'Remove this party member?',
    'admin:party.error.title': 'Error Loading Party',
    'admin:party.error.failed': 'Failed to load party members: {{error}}',
    'admin:party.error.loadFailed': 'Failed to load party members',
    'admin:party.error.addFailed': 'Failed to add party member',
    'admin:party.error.removeFailed': 'Failed to remove party member',
    'admin:party.error.updateFailed': 'Failed to update party member',
    'admin:party.error.loadingError': 'Error loading party members: {{error}}',
    'admin:party.retry': 'Retry',

    'adminLogin:pageTitle': 'Admin Login - Wedding of Iluminada & George',
    'adminLogin:header': 'Admin Login',
    'adminLogin:home': 'Home',
    'adminLogin:subHeader': 'Access the Admin Panel',
    'adminLogin:description': 'Enter your credentials to manage wedding details and RSVPs.',
    'adminLogin:username': 'Username',
    'adminLogin:usernamePlaceholder': 'Your username',
    'adminLogin:password': 'Password',
    'adminLogin:passwordPlaceholder': 'Your secret password',
    'adminLogin:submit': 'Sign in',

    'common:advancedFeatures': 'Advanced Features Examples',
    'common:numberFormatting': 'Number Formatting',
    'common:price': 'Price',
    'common:percentage': 'Percentage',
    'common:dateFormatting': 'Date Formatting',
    'common:currentDate': 'Current Date',
    'common:currentTime': 'Current Time',
    'common:currencyFormatting': 'Currency Formatting',
    'common:gift': 'Gift',
  },
  es: {
    'common:days': 'Días',
    'common:hours': 'Horas',
    'common:minutes': 'Minutos',
    'common:seconds': 'Segundos',
    'common:primary': 'Principal',
    'common:saving': 'Guardando...',
    'common:menuSelectionsSaved': '¡Selecciones de menú guardadas con éxito!',
    'common:errorSavingMenuSelections': 'Error al guardar las selecciones de menú',
    'common:menuSelectionSaved': '¡Selección de menú guardada con éxito!',
    'common:errorSavingMenuSelection': 'Error al guardar la selección de menú',
    'common:specialRequestSaved': '¡Solicitud especial guardada con éxito!',
    'common:errorSavingSpecialRequest': 'Error al guardar la solicitud especial',
    'common:specialRequestDetailsSaved': '¡Detalles de solicitud especial guardados con éxito!',
    'common:errorSavingSpecialRequestDetails': 'Error al guardar los detalles de la solicitud especial',

    'wedding:title': 'Iluminada & George',
    'wedding:subtitle': 'Nos casamos!',
    'wedding:date': '6 de Junio, 2026 • Marbella, Spain',
    'wedding:hero.description': 'Iluminada y George se casan en la playa de Marbella este junio y nos hace muy felices poder compartirlo con vosotros. Sol, mar y muchas risas.',
    'wedding:hero.description2': 'Esta web es vuestro centro de boda. Inicia sesión con el correo del RSVP para confirmar tu grupo, elegir el menú, ver el programa, revisar la lista de regalos y chatear con otros invitados.',

    'wedding:guestZone.title': 'Zona de Invitados',
    'wedding:guestZone.description': 'Aquí puedes gestionar todos los detalles de tu participación en nuestra boda.',

    'common:login': 'Iniciar sesión',
    'login:pageTitle': 'Acceso guests - Boda',
    'login:header': 'Acceso para guests',
    'login:home': 'Inicio',
    'login:emailLabel': 'Email:',
    'login:emailPlaceholder': 'Introduce tu email',
    'login:submit': 'Acceder',
    'login:enterEmail': 'Por favor, introduce tu email.',
    'login:successRedirect': 'Acceso exitoso. Redirigiendo...',
    'login:emailNotFound': 'Email no encontrado en la lista de guests',
    'login:serverError': 'Error de conexión con el servidor',

    'adminLogin:pageTitle': 'Acceso Administrador',
    'adminLogin:header': 'Acceso Administrador',
    'adminLogin:home': 'Inicio',
    'adminLogin:subHeader': 'Acceso al Panel de Administrador',
    'adminLogin:description': 'Introduce tus credenciales para gestionar los detalles de la boda y las confirmaciones de asistencia.',
    'adminLogin:username': 'Usuario',
    'adminLogin:usernamePlaceholder': 'Tu name de usuario',
    'adminLogin:password': 'Contraseña',
    'adminLogin:passwordPlaceholder': 'Tu contraseña secreta',
    'adminLogin:submit': 'Iniciar Sesión',

    'guests:title': 'Zona de Invitados - Boda de Iluminada & George',
    'guests:welcomeTitle': 'Zona de Invitados',
    'guests:tabSummary': 'Resumen',
    'guests:tabMenu': 'Menú',
    'guests:tabAgenda': 'Agenda',
    'guests:tabRSVP': 'RSVP',
    'guests:tabGifts': 'Regalos',
    'guests:menuSelection': 'Selección de Menú',
    'guests:menuSelectionDesc': 'Tu selección actual de menú para nuestra boda.',
    'guests:menuSelectionDesc2': 'Elige tus platos preferidos para nuestra boda.',

        // Summary Page
    'guests:summaryPageTitle': 'Bienvenido a las páginas de la Boda de Iluminada & George',
    'rich:guests:summaryPageDescription': 'Aquí encontrarás toda la información que necesitas para llegar y disfrutar de la boda.',

    'guests:summaryYourParty': 'Tu Grupo',
    'common:People': 'personas',
    'common:Person': 'persona',
    'guests:summaryRSVP': 'Resumen de RSVP',
    'guests:summaryMenuSelections': 'Selecciones de Menú',


    // Party Page
    'guests:partyPageTitle': 'Gestión de la Grupo',
    'guests:partyPageDescription': 'Gestiona a tus miembros de su grupo de invitados y sus requisitos dietéticos.',

    // Events Page
    'guests:eventsPageTitle': 'RSVP a los Eventos de la Boda a continuación',
    'guests:eventsPageDescription': 'Estamos emocionados de tenerte con nosotros en la boda. Aquí están los detalles de todos los eventos que tendrán lugar. Por favor selecciona tu nombre en cada evento en la sección Who\'s Attending. Así podemos preparar todo para que tengas un gran tiempo.',
    'guests:eventAgenda': 'Agenda de Eventos',
    'guests:eventsLoading': 'Cargando eventos...',
    'guests:eventsNoEvents': 'No hay eventos disponibles',
    'guests:eventsNoEventsDescription': 'Aún no hay eventos programados. Por favor, vuelve a consultar más tarde.',
    'guests:eventsNoPartyMembers': 'No se encontraron miembros del grupo.',
    'guests:eventsViewOnMap': 'Ver en el Mapa',
    'guests:eventsWhosAttending': '¿Quién asiste?',
    'guests:eventsErrorTitle': 'Error al cargar eventos',
    'guests:eventsErrorMessage': 'Hubo un problema al cargar los eventos. Por favor, inténtalo de nuevo.',
    'guests:eventsSchedule': 'Programa',
    'guests:childBadge': 'Niño',
    'guests:eventsAttendanceSavedSuccess': '¡Opciones de asistencia guardadas con éxito!',
    'guests:eventsAttendanceSavedError': 'Error al guardar las opciones de asistencia',
    'guests:eventsSaveAttendanceChoices': 'Guardar Opciones de Asistencia',
    'guests:eventAgendaDesc': 'Tus confirmaciones de asistencia a los eventos de nuestra boda.',
    'guests:eventAgendaDesc2': 'Confirma tu asistencia a cada uno de los eventos de nuestra boda.',
    'guests:eventRSVP': 'RSVP',
    'guests:eventRSVPSummary': 'Tus confirmaciones de asistencia a los eventos de nuestra boda.',
    'guests:eventRSVPDesc': 'Las celebraciones se llevarán a cabo en tres días: viernes, sábado y domingo. Comenzarán el viernes con una cena de bienvenida.   El sábado será un día completo de actividades incluyendo el matrimonio, la recepción banquete y la danza.   Las actividades del domingo incluyen un brunch de despedida.  Por favor confirma tu asistencia para cualquiera de estos eventos que asistirás.',
    'guests:giftList': 'Lista de Regalos',
    'guests:giftListDesc': 'Tus regalos reservados de nuestra lista de deseos.',
    'guests:giftListDesc2': 'Si deseas hacernos un regalo, aquí tienes nuestra lista de deseos. Puedes reservar cualquier regalo que te guste.',
    'guests:logout': 'Cerrar sesión',
    'guests:backToHome': 'Volver al inicio',
    'guests:confirmed': 'Confirmado',
    'guests:pending': 'Pendiente',
    'guests:event': 'Evento',
    'guests:reserved': 'Reservado',

    // Menu Page
    'guests:menuPageTitle': 'Selección de Menú',
    'guests:menuPageDescription': 'Elige tus platos preferidos para nuestra boda.',
    'guests:currentSelection': 'Tu selección actual',
    'guests:starter': 'Entrante:',
    'guests:mainCourse': 'Plato principal:',
    'guests:dessert': 'Postre:',
    'guests:specialOption': 'Opción especial:',
    'guests:allergies': 'Alergias:',
    'guests:notSelected': 'No seleccionado',
    'guests:selectionStatus': 'Estado de selección',
    'guests:noSelectionYet': 'Aún no has realizado tu selección de menú. Haz clic en el botón de arriba para comenzar.',
    'guests:eventConfirmations': 'Tus confirmaciones de eventos',
    'guests:noEventConfirmations': 'Aún no has confirmado asistencia a ningún evento.',
    'guests:giftReservations': 'Tus regalos reservados',
    'guests:noGiftReservations': 'Aún no has reservado ningún regalo de nuestra lista.',
    'guests:confirmAction': 'Confirmar acción',
    'guests:commentsTitle': 'Comentarios',
    'rich:guests:commentsSubtitle': 'Comparte tus pensamientos con otros guests',
    'rich:guests:commentPlaceholder': `
      <textarea
        id="newComment"
        name="comment"
        placeholder="Escribe tu comentario..."
        rows="3"
        maxlength="500"
      ></textarea>
    `,
    'guests:postComment': 'Publicar',
    'guests:loadingComments': 'Cargando comentarios...',
    'guests:noComments': 'No hay comentarios aún. ¡Sé el primero en comentar!',
    'guests:commentPosted': 'Comentario publicado con éxito',
    'guests:commentDeleted': 'Comentario eliminado con éxito',
    'guests:deleteCommentConfirm': '¿Estás seguro de que quieres eliminar este comentario?',
    'guests:cancel': 'Cancelar',
    'guests:confirm': 'Confirmar',
    'guests:errorLoadingMenu': 'Error al cargar el status del menú:',
    'guests:errorConnection': 'Error de conexión con el servidor.',
    'guests:welcome': 'Bienvenido',
    'guests:welcomePersonalized': 'Bienvenido',
    'guests:menuSaved': 'Menú guardado con éxito',
    
    // Menu Selection Page
    'guests:menuLoading': 'Cargando menú...',
    'guests:menuErrorTitle': 'Error al Cargar el Menú',
    'guests:menuErrorMessage': 'No se pudieron cargar los datos del menú. Por favor, inténtalo de nuevo más tarde.',
    'guests:menuErrorMessage2': 'Hubo un problema al cargar el menú. Por favor, inténtalo de nuevo.',
    'guests:retry': 'Reintentar',
    'guests:courseGroupStarters': 'Entrantes',
    'guests:courseGroupMainCourses': 'Platos Principales',
    'guests:courseGroupDesserts': 'Postres',
    'guests:courseGroupDrinks': 'Bebidas',
    'guests:selectionRequired': 'Selección Requerida',
    'guests:infoOnly': 'Solo Información',
    'guests:whosHavingThis': '¿Quién va a tomar esto?',
    'guests:selectedCount': 'seleccionado',
    'guests:dietaryRequirementsTitle': 'Requisitos Dietéticos y Solicitudes Especiales',
    'guests:dietaryRequirementsDescription': 'Por favor, cuéntanos sobre cualquier requisito dietético o alergia para cada invitado.',
    'guests:dietaryVegetarian': 'Vegetariano',
    'guests:dietaryLactoseIntolerant': 'Intolerante a la Lactosa',
    'guests:dietaryGlutenIntolerant': 'Intolerante al Gluten',
    'guests:dietaryNutAllergy': 'Alergia a los Frutos Secos',
    'guests:dietaryOther': 'Otro',
    'guests:additionalDetailsLabel': 'Detalles adicionales o requisitos específicos:',
    'guests:saveMenuSelections': 'Guardar Selecciones del Menú',
    
    'common:home': 'Inicio',
    
    // Gifts
    'guests:giftsPageTitle': 'Lista de Regalos',
    'guests:giftsPageDescription': 'Tu presencia es nuestro regalo. Pero si quieres contribuir a nuestro viaje de novios, puedes elegir un regalo divertido de la lista abajo y se imprimirá con tu mensaje y se mostrará en una gran pared en el banquete de la boda.  La cantidad de dinero que elijas se usará para financiar nuestro viaje de novios.  Gracias',
    'guests:giftsLoading': 'Cargando regalos...',
    'guests:giftsThankYouTitle': '¡Gracias por tu generosidad!',
    'guests:giftsThankYouMessage': '¡Nos encanta tu generosidad!',
    'rich:guests:giftsDonatedOn': 'Donado el {{date}}',
    'guests:giftsRegistryTitle': 'Registro de Regalos',
    'guests:giftsRegistrySubtitle': 'Elige de nuestros regalos cuidadosamente seleccionados',
    'guests:giftsNoAvailable': 'No hay regalos disponibles',
    'guests:giftsNoAvailableDescription': 'Por favor, revisa más tarde para nuestro registro de regalos.',
    'guests:giftsAvailable': 'disponible',
    'guests:giftsSoldOut': 'Agotado',
    'guests:giftsBuyGift': 'Comprar Regalo',
    'guests:giftsPaymentSuccess': '¡Gracias por tu regalo! Tu pago fue exitoso.',
    'guests:giftsPaymentCancelled': 'El pago fue cancelado.',
    'guests:giftsErrorLoading': 'Error al cargar los regalos',
    'guests:giftsErrorLoadingDescription': 'Hubo un problema al cargar los regalos. Por favor, inténtalo de nuevo.',
    'guests:giftsRetry': 'Reintentar',
    'guests:giftsPurchaseTitle': 'Comprar Regalo',
    'guests:giftsPurchaseAbout': 'Estás a punto de comprar:',
    'guests:giftsPurchaseMessageLabel': 'Añade un mensaje personal (opcional):',
    'guests:giftsPurchaseMessagePlaceholder': 'Deja un mensaje bonito para el matrimonio...',
    'guests:giftsPurchaseCancel': 'Cancelar',
    'guests:giftsPurchaseProceed': 'Proceder al Pago',
    'guests:giftsPurchaseProcessing': 'Procesando...',
    'guests:giftsPaymentError': 'Error al procesar el pago',
    'guests:giftsPaymentServiceError': 'Error al conectar con el servicio de pago',
    'guests:tabCash': 'Regalos',
    'guests:cashGifts': 'Regalos',
    'guests:cashGiftsDesc': 'Si prefieres hacer un regalo en efectivo, puedes elegir una cantidad fija o personalizada. Tu generosidad nos ayudará a comenzar nuestra nueva vida juntos.',
    'guests:cashGiftsSummaryDesc': 'Tus regalos en efectivo realizados para nuestra boda.',
    'guests:cashGiftsSummary': 'Resumen de Regalos',
    'guests:totalAmount': 'Cantidad total:',
    'guests:giftCount': 'Número de regalos:',
    'guests:lastGift': 'Último regalo:',
    'guests:noCashGifts': 'Aún no has realizado ningún regalo en efectivo.',
    'guests:giftDate': 'Fecha del regalo:',
    'guests:giftMessage': 'Mensaje:',
    'guests:giftHistory': 'Historial de regalos',
    'guests:smallGift': 'Regalo pequeño',
    'guests:mediumGift': 'Regalo medio',
    'guests:generousGift': 'Regalo generoso',
    'guests:specialGift': 'Regalo especial',
    'guests:donorInfo': 'Tu Información',
    'guests:donorName': 'Name completo',
    'guests:donorEmail': 'Email',
    'guests:donorMessage': 'Mensaje para los novios (opcional)',
    'guests:messagePlaceholder': 'Escribe un mensaje especial para Iluminada y George...',
    'guests:paymentSummary': 'Resumen del Regalo',
    'guests:proceedPayment': 'Proceder al Pago',
    'guests:selectAmount': 'Por favor, selecciona una cantidad',
    'guests:fillRequired': 'Por favor, completa todos los campos obligatorios',
    'guests:processing': 'Procesando pago...',
    'guests:error': 'Error al procesar el pago',

    // Admin
    'admin:pageTitle': 'Panel de Administración',
    'admin:title': 'Panel de Administración',
    'admin:home': 'Inicio',
    'admin:logout': 'Cerrar sesión',
    'admin:welcomeTitle': 'Bienvenido, Administrador',
    'admin:welcomeDesc': 'Gestiona toda la información de la boda de Iluminada y George',
    'admin:tab.guests': 'Invitados',
    'admin:tab.gifts': 'Lista de Regalos',
    'admin:tab.messages': 'Mensajes',
    'admin:tab.events': 'Agenda de Eventos',
    'admin:tab.menus': 'Gestión de Menús',
    'admin:tab.settings': 'Configuración',
    'admin:loading': 'Cargando...',
    'admin:loadingGuests': 'Cargando invitados...',
    'admin:uploadingGuests': 'Cargando invitados...',
    'admin:loadingPartyMembers': 'Cargando miembros del grupo...',
    'admin:loadingGiftList': 'Cargando lista de regalos...',
    'admin:loadingMessages': 'Cargando mensajes...',
    'admin:loadingEventSchedule': 'Cargando agenda de eventos...',
    'admin:loadingCourses': 'Cargando cursos...',
    'admin:loadingSettings': 'Cargando configuración...',
    'admin:footer': 'Panel de administración',

    // Admin Guests Section
    'admin:guests.errorLoading': 'Error al cargar invitados',
    'admin:guests.adult': 'Adulto',
    'admin:guests.child': 'Niño',
    'admin:guests.totalGuests': 'Total de Invitados',
    'admin:guests.acrossParties': 'Sobre {{count}} {{partyWord}}',
    'admin:guests.addGuest': 'Añadir Invitado',
    'admin:guests.bulkUploadCsv': 'Carga Masiva CSV',
    'admin:guests.table.name': 'Nombre',
    'admin:guests.table.email': 'Email',
    'admin:guests.table.ageCategory': 'Mayor',
    'admin:guests.table.partySize': 'Tamaño del Grupo',
    'admin:guests.table.actions': 'Acciones',
    'admin:guests.confirmDelete': '¿Eliminar este invitado y todo su grupo?',
    'admin:guests.editTitle': 'Editar invitado',
    'admin:guests.addTitle': 'Añadir invitado',
    'admin:guests.save': 'Guardar',
    'admin:guests.add': 'Añadir',
    'admin:guests.field.name': 'Nombre',
    'admin:guests.field.email': 'Email',
    'admin:guests.field.ageCategory': 'Categoría de Edad',
    'admin:guests.option.adult': 'Adulto (18+)',
    'admin:guests.option.child': 'Niño (Menos de 18)',
    'admin:guests.csv.noValidGuests': 'No se encontraron invitados válidos en el archivo CSV',
    'admin:guests.csv.uploadCount': '¿Subir {{count}} invitados?',
    'admin:guests.csv.preview': 'Vista previa:',
    'admin:guests.csv.more': '... y {{count}} más',
    'admin:guests.csv.uploadComplete': '¡Subida completa!',
    'admin:guests.csv.successCreated': 'Creados exitosamente: {{count}}',
    'admin:guests.csv.skippedDuplicates': 'Omitidos (duplicados/vacíos): {{count}}',
    'admin:guests.csv.errors': 'Errores: {{count}}',
    'admin:guests.csv.firstError': 'Primer error: {{error}}',
    'admin:guests.csv.uploadingError': 'Error al subir CSV: {{error}}',
    'admin:guests.error.title': 'Error al Cargar Invitados',
    'admin:guests.error.failed': 'Error al cargar invitados: {{error}}',
    'admin:guests.retry': 'Reintentar',

    // Admin Party Management Section
    'admin:party.title': 'Gestionar Grupo: ',
    'admin:party.description': 'Gestionar miembros del grupo para este invitado',
    'admin:party.backToGuests': 'Volver a Invitados',
    'admin:party.primaryGuest': 'Invitado Principal',
    'admin:party.unknown': 'Desconocido',
    'admin:party.adult': 'Adulto',
    'admin:party.child': 'Niño',
    'admin:party.partyMembers': 'Miembros del Grupo',
    'admin:party.addMember': 'Añadir Miembro',
    'admin:party.noMembers': 'Aún no se han añadido miembros al grupo.',
    'admin:party.table.name': 'Nombre',
    'admin:party.table.ageGroup': 'Grupo de Edad',
    'admin:party.table.actions': 'Acciones',
    'admin:party.addModalTitle': 'Añadir Miembro del Grupo',
    'admin:party.add': 'Añadir',
    'admin:party.field.name': 'Nombre',
    'admin:party.field.ageGroup': 'Grupo de Edad',
    'admin:party.option.adult': 'Adulto (18+)',
    'admin:party.option.child': 'Niño (Menos de 18)',
    'admin:party.editModalTitle': 'Editar Miembro del Grupo',
    'admin:party.save': 'Guardar',
    'admin:party.confirmRemove': '¿Eliminar este miembro del grupo?',
    'admin:party.error.title': 'Error al Cargar Grupo',
    'admin:party.error.failed': 'Error al cargar miembros del grupo: {{error}}',
    'admin:party.error.loadFailed': 'Error al cargar miembros del grupo',
    'admin:party.error.addFailed': 'Error al añadir miembro del grupo',
    'admin:party.error.removeFailed': 'Error al eliminar miembro del grupo',
    'admin:party.error.updateFailed': 'Error al actualizar miembro del grupo',
    'admin:party.error.loadingError': 'Error al cargar miembros del grupo: {{error}}',
    'admin:party.retry': 'Reintentar',

    // Admin Gifts Section
    'admin:gifts.title': 'Lista de Regalos',
    'admin:gifts.add': 'Añadir',
    'admin:gifts.edit': 'Editar regalo',
    'admin:gifts.save': 'Guardar',
    'admin:gifts.deleteConfirm': '¿Eliminar este regalo?',
    'admin:gifts.noImage': 'Sin imagen',
    'admin:gifts.grandTotal': 'Total General',
    'admin:gifts.grandTotalDescription': 'Las tarjetas disponibles x precio',
    'admin:gifts.table.name': 'Nombre',
    'admin:gifts.table.description': 'Descripción',
    'admin:gifts.table.image': 'Imagen',
    'admin:gifts.table.available': 'Disponible',
    'admin:gifts.table.price': 'Precio',
    'admin:gifts.table.purchased': 'Comprado',
    'admin:gifts.table.actions': 'Acciones',
    'admin:gifts.field.name': 'Nombre',
    'admin:gifts.field.description': 'Descripción',
    'admin:gifts.field.image': 'Imagen',
    'admin:gifts.field.available': 'Número Disponible',
    'admin:gifts.field.price': 'Precio',
    'admin:gifts.field.imageHelp': 'Subir imagen de tarjeta de regalo (se almacenará en la base de datos)',
    'admin:gifts.priceOption.25': '€25',
    'admin:gifts.priceOption.50': '€50',
    'admin:gifts.priceOption.100': '€100',
    'admin:gifts.priceOption.200': '€200',
    'admin:gifts.priceOption.500': '€500'

  },
  fr: {
    'common:days': 'Jours',
    'common:hours': 'Heures',
    'common:minutes': 'Minutes',
    'common:seconds': 'Secondes',
    'common:primary': 'Principal',
    'common:saving': 'Enregistrement...',
    'common:menuSelectionsSaved': 'Sélection de menu enregistrée avec succès!',
    'common:errorSavingMenuSelections': 'Erreur lors de l\'enregistrement des sélections de menu',
    'common:menuSelectionSaved': 'Sélection de menu enregistrée avec succès!',
    'common:errorSavingMenuSelection': 'Erreur lors de l\'enregistrement de la sélection de menu',
    'common:specialRequestSaved': 'Demande spéciale enregistrée avec succès!',
    'common:errorSavingSpecialRequest': 'Erreur lors de l\'enregistrement de la demande spéciale',
    'common:specialRequestDetailsSaved': 'Détails de demande spéciale enregistrés avec succès!',
    'common:errorSavingSpecialRequestDetails': 'Erreur lors de l\'enregistrement des détails de la demande spéciale',

    'wedding:title': 'Iluminada & George',
    'wedding:subtitle': 'On se marie!',
    'wedding:date': '6 Juin 2026 • Marbella, Spain',
    'wedding:hero.description': 'Iluminada et George se marient sur la plage de Marbella en juin et nous sommes ravis de partager ce moment avec vous. Soleil, mer et beaucoup de rires.',
    'wedding:hero.description2': 'Ce site est votre espace mariage. Connectez-vous avec l’e-mail de votre RSVP pour confirmer votre groupe, choisir votre menu, voir le programme, consulter la liste de cadeaux et discuter avec les autres invités.',
    'wedding:ceremony.title': 'Cérémonie',
    'wedding:ceremony.venue': 'Église San Miguel',
    'wedding:ceremony.address': 'Plaza Mayor, 1',
    'wedding:ceremony.city': 'Madrid, Espagne',
    'wedding:ceremony.time': '12h00',
    'wedding:celebration.title': 'Célébration',
    'wedding:celebration.venue': 'Palais des Ducs',
    'wedding:celebration.address': 'Rue Gran Vía, 28',
    'wedding:celebration.city': 'Madrid, Espagne',
    'wedding:celebration.time': '14h00',
    'wedding:location.title': 'Emplacement',
    'wedding:location.description': 'Les deux événements se tiendront au centre de Madrid, avec un accès facile par les transports publics.',
    'wedding:location.viewMap': 'Voir sur la carte',

    'wedding:guestZone.title': 'Zone des Invités',
    'wedding:guestZone.description': 'Ici vous pouvez gérer tous les détails de votre participation à notre mariage.',

    'common:login': 'Se connecter',
    'login:pageTitle': 'Accès Invités',
    'login:header': 'Accès Invités',
    'login:home': 'Accueil',
    'login:emailLabel': 'Email:',
    'login:emailPlaceholder': 'Entrez votre email',
    'login:submit': 'Continuer',
    'login:enterEmail': 'Veuillez entrer votre email.',
    'login:successRedirect': 'Connexion réussie. Redirection...',
    'login:emailNotFound': 'Email non trouvé dans la liste des invités',
    'login:serverError': 'Erreur de connexion au serveur',

    'adminLogin:pageTitle': 'Accès Administrateur ',
    'adminLogin:header': 'Accès Administrateur',
    'adminLogin:home': 'Accueil',
    'adminLogin:subHeader': 'Accès au Panel Administrateur',
    'adminLogin:description': 'Entrez vos identifiants pour gérer les détails du mariage et les confirmations de présence.',
    'adminLogin:username': 'Nom d\'utilisateur',
    'adminLogin:usernamePlaceholder': 'Votre nom d\'utilisateur',
    'adminLogin:password': 'Mot de passe',
    'adminLogin:passwordPlaceholder': 'Votre mot de passe secret',
    'adminLogin:submit': 'Se connecter',

    'common:thankYou': 'Merci de faire partie de notre jour spécial',
    'common:countdownMessage': 'Aujourd\'hui est le grand jour !',
    'common:loadingEvents': 'Chargement des événements...',

    'common:advancedFeatures': 'Exemples de Fonctionnalités Avancées',
    'common:numberFormatting': 'Formatage de Names',
    'common:price': 'Prix',
    'common:percentage': 'Pourcentage',
    'common:dateFormatting': 'Formatage de Dates',
    'common:currentDate': 'Date Actuelle',
    'common:currentTime': 'Heure Actuelle',
    'common:currencyFormatting': 'Formatage de Devise',
    'common:gift': 'Cadeau',

    'guests:title': 'Zone des Invités - Mariage d\'Iluminada & George',
    'guests:welcomeTitle': 'Zone des invités',
    'guests:tabSummary': 'Résumé',
    'guests:tabMenu': 'Menu',
    'guests:tabAgenda': 'Agenda',
    'guests:tabRSVP': 'RSVP',
    'guests:tabGifts': 'Cadeaux',
    'guests:menuSelection': 'Sélection du Menu',
    'guests:menuSelectionDesc': 'Votre sélection actuelle de menu pour notre mariage.',
    'guests:menuSelectionDesc2': 'Choisissez vos plats préférés pour notre mariage.',

    // Summary Page
    'guests:summaryPageTitle': 'Bienvenue aux pages Ilu et George',
    'rich:guests:summaryPageDescription': 'Ici tu trouvera tous ce qu\'il faut d\'arriver et bien profiter du marriage.',

    // Party Page
    'guests:partyPageTitle': 'Your party members',
    'guests:partyPageDescription': 'Management of your party members and their dietry requirements',

    // Events Page
    'guests:eventsPageTitle': 'RSVP aux Événements de Mariage ci-dessous',
    'guests:eventsPageDescription': 'Nous sommes ravis de vous avoir avec nous pour le mariage. Voici les détails de tous les événements qui auront lieu. Veuillez sélectionner votre nom dans chaque événement dans la section Who\'s Attending. Ainsi nous pouvons préparer tout pour que vous.passiez un excellent moment.',
    'guests:eventAgenda': 'Agenda des Événements',
    'guests:eventsLoading': 'Chargement des événements...',
    'guests:eventsNoEvents': 'Aucun événement disponible',
    'guests:eventsNoEventsDescription': 'Aucun événement n\'est encore prévu. Veuillez vérifier plus tard.',
    'guests:eventsNoPartyMembers': 'Aucun membre du groupe trouvé.',
    'guests:eventsViewOnMap': 'Voir sur la Carte',
    'guests:eventsWhosAttending': 'Qui assiste ?',
    'guests:eventsErrorTitle': 'Erreur de chargement des événements',
    'guests:eventsErrorMessage': 'Un problème est survenu lors du chargement des événements. Veuillez réessayer.',
    'guests:eventsSchedule': 'Programme',
    'guests:childBadge': 'Enfant',
    'guests:eventsAttendanceSavedSuccess': 'Choix de présence enregistrés avec succès !',
    'guests:eventsAttendanceSavedError': 'Erreur lors de l\'enregistrement des choix de présence',
    'guests:eventsSaveAttendanceChoices': 'Enregistrer les Choix de Présence',
    'guests:eventAgendaDesc': 'Vos confirmations de présence pour les événements de notre mariage.',
    'guests:eventAgendaDesc2': 'Confirmez votre présence à chacun des événements de notre mariage.',
    'guests:eventRSVP': 'RSVP',
    'guests:eventRSVPSummary': 'Vos confirmations de présence pour les événements de notre mariage.',
    'guests:eventRSVPDesc': 'Les célébrations auront lieu sur trois jours : vendredi, samedi et dimanche. Ils commenceront le vendredi avec un dîner de bienvenue.   Le samedi sera un jour complet d\'activités incluant le mariage, le banquet de réception et la danse.   Les activités du dimanche incluent un brunch de départ.  Veuillez confirmer votre présence pour l\'un de ces événements que vous assisteriez.',
    'guests:giftList': 'Liste de Cadeaux',
    'guests:giftListDesc': 'Vos cadeaux réservés de notre liste de souhaits.',
    'guests:giftListDesc2': 'Si vous souhaitez nous offrir un cadeau, voici notre liste de souhaits. Vous pouvez réserver n\'importe quel cadeau qui vous plaît.',
    'guests:logout': 'Se déconnecter',
    
    'guests:backToHome': 'Retour à l\'accueil',
    'guests:confirmed': 'Confirmé',
    'guests:pending': 'En attente',
    'guests:event': 'Événement',
    'guests:reserved': 'Réservé',
    'guests:currentSelection': 'Votre sélection actuelle',
    'guests:starter': 'Entrée:',
    'guests:mainCourse': 'Plat principal:',
    'guests:dessert': 'Dessert:',
    'guests:specialOption': 'Option spéciale:',
    'guests:allergies': 'Allergies:',

    // Menu Page
    'guests:menuPageTitle': 'Menu Selection',
    'guests:menuPageDescription': 'Choose your preferred dishes for the wedding banquet.',
    'guests:notSelected': 'Non sélectionné',
    'guests:selectionStatus': 'Statut de sélection',
    'guests:noSelectionYet': 'Vous n\'avez pas encore fait votre sélection de menu. Cliquez sur le bouton ci-dessus pour commencer.',
    'guests:eventConfirmations': 'Vos confirmations d\'événements',
    'guests:noEventConfirmations': 'Vous n\'avez pas encore confirmé votre présence à aucun événement.',
    'guests:giftReservations': 'Vos cadeaux réservés',
    'guests:noGiftReservations': 'Vous n\'avez pas encore réservé de cadeaux de notre liste.',
    'guests:confirmAction': 'Confirmer l\'action',
    'guests:commentsTitle': 'Commentaires',
    'rich:guests:commentsSubtitle': 'Partagez vos pensées avec d\'autres invités',
    'rich:guests:commentPlaceholder': `
      <textarea
        id="newComment"
        name="comment"
        placeholder="Ecrire tes commentaires..."
        rows="3"
        maxlength="500"
      ></textarea>
     `,
    'guests:postComment': 'Publier',
    'guests:loadingComments': 'Chargement des commentaires...',
    'guests:noComments': 'Aucun commentaire pour le moment. Soyez le premier à commenter !',
    'guests:commentPosted': 'Commentaire publié avec succès',
    'guests:commentDeleted': 'Commentaire supprimé avec succès',
    'guests:deleteCommentConfirm': 'Êtes-vous sûr de vouloir supprimer ce commentaire ?',
    'guests:cancel': 'Annuler',
    'guests:confirm': 'Confirmer',
    'guests:errorLoadingMenu': 'Erreur lors du chargement du statut du menu:',
    'guests:errorConnection': 'Erreur de connexion au serveur.',
    'guests:welcome': 'Bienvenue',
    'guests:welcomePersonalized': 'Bienvenue',
    'guests:menuSaved': 'Menu enregistré avec succès',
    
    // Menu Selection Page
    'guests:menuLoading': 'Chargement du menu...',
    'guests:menuErrorTitle': 'Erreur de Chargement du Menu',
    'guests:menuErrorMessage': 'Impossible de charger les données du menu. Veuillez réessayer plus tard.',
    'guests:menuErrorMessage2': 'Il y a eu un problème lors du chargement du menu. Veuillez réessayer.',
    'guests:retry': 'Réessayer',
    'guests:courseGroupStarters': 'Entrées',
    'guests:courseGroupMainCourses': 'Plats Principaux',
    'guests:courseGroupDesserts': 'Desserts',
    'guests:courseGroupDrinks': 'Boissons',
    'guests:selectionRequired': 'Sélection Requise',
    'guests:infoOnly': 'Info Seulement',
    'guests:whosHavingThis': 'Qui prend ceci ?',
    'guests:selectedCount': 'sélectionné',
    'guests:dietaryRequirementsTitle': 'Exigences Diététiques & Demandes Spéciales',
    'guests:dietaryRequirementsDescription': 'Veuillez nous faire savoir toute exigence diététique ou allergie pour chaque invité.',
    'guests:dietaryVegetarian': 'Végétarien',
    'guests:dietaryLactoseIntolerant': 'Intolérant au Lactose',
    'guests:dietaryGlutenIntolerant': 'Intolérant au Gluten',
    'guests:dietaryNutAllergy': 'Allergie aux Noix',
    'guests:dietaryOther': 'Autre',
    'guests:additionalDetailsLabel': 'Détails supplémentaires ou exigences spécifiques :',
    'guests:saveMenuSelections': 'Enregistrer les Sélections du Menu',
    
    'common:home': 'Accueil',

    // Gifts
    'guests:giftsPageTitle': 'Liste de Cadeaux',
    'guests:giftsPageDescription': 'Votre présence est notre cadeau. Mais si vous voulez contribuer à notre lune de miel, vous pouvez choisir un cadeau amusant de la liste ci-dessous et il sera imprimé avec votre message et affiché sur une grande paroi au banquet de mariage.  Le montant en espèces que vous choisissez sera utilisé pour financer notre lune de miel.  Merci',
    'guests:giftsLoading': 'Chargement des cadeaux...',
    'guests:giftsThankYouTitle': 'Merci pour votre générosité!',
    'guests:giftsThankYouMessage': 'Nous sommes si reconnaissants pour vos merveilleux cadeaux',
    'rich:guests:giftsDonatedOn': 'Donné le {{date}}',
    'guests:giftsRegistryTitle': 'Registre de Cadeaux',
    'guests:giftsRegistrySubtitle': 'Choisissez parmi nos cadeaux soigneusement sélectionnés',
    'guests:giftsNoAvailable': 'Aucun cadeau disponible',
    'guests:giftsNoAvailableDescription': 'Veuillez vérifier plus tard pour notre registre de cadeaux.',
    'guests:giftsAvailable': 'disponible',
    'guests:giftsSoldOut': 'Épuisé',
    'guests:giftsBuyGift': 'Acheter un Cadeau',
    'guests:giftsPaymentSuccess': 'Merci pour votre cadeau! Votre paiement a été réussi.',
    'guests:giftsPaymentCancelled': 'Le paiement a été annulé.',
    'guests:giftsErrorLoading': 'Erreur lors du chargement des cadeaux',
    'guests:giftsErrorLoadingDescription': 'Il y a eu un problème lors du chargement des cadeaux. Veuillez réessayer.',
    'guests:giftsRetry': 'Réessayer',
    'guests:giftsPurchaseTitle': 'Acheter un Cadeau',
    'guests:giftsPurchaseAbout': 'Vous êtes sur le point d\'acheter:',
    'guests:giftsPurchaseMessageLabel': 'Ajouter un message personnel (optionnel):',
    'guests:giftsPurchaseMessagePlaceholder': 'Laissez un message aimable pour la nouvelle équipe...',
    'guests:giftsPurchaseCancel': 'Annuler',
    'guests:giftsPurchaseProceed': 'Procéder au Paiement',
    'guests:giftsPurchaseProcessing': 'Traitement du paiement...',
    'guests:giftsPaymentError': 'Erreur lors du traitement du paiement',
    'guests:giftsPaymentServiceError': 'Erreur lors de la connexion au service de paiement',
    'guests:tabCash': 'Cadeaux',
    'guests:cashGifts': 'Cadeaux',
    'guests:cashGiftsDesc': 'Si vous préférez faire un cadeau en espèces, vous pouvez choisir un montant fixe ou personnalisé. Votre générosité nous aidera à commencer notre nouvelle vie ensemble.',
    'guests:cashGiftsSummaryDesc': 'Vos cadeaux en espèces faits pour notre mariage.',
    'guests:cashGiftsSummary': 'Résumé des Cadeaux',
    'guests:totalAmount': 'Montant total:',
    'guests:giftCount': 'Name de cadeaux:',
    'guests:lastGift': 'Dernier cadeau:',
    'guests:noCashGifts': 'Vous n\'avez pas encore fait de cadeaux.',
    'guests:giftDate': 'Date du cadeau:',
    'guests:giftMessage': 'Message:',
    'guests:giftHistory': 'Historique des cadeaux',
    'guests:smallGift': 'Petit cadeau',
    'guests:mediumGift': 'Cadeau moyen',
    'guests:generousGift': 'Cadeau généreux',
    'guests:specialGift': 'Cadeau spécial',
    'guests:donorInfo': 'Vos Informations',
    'guests:donorName': 'Nom complet',
    'guests:donorEmail': 'Email',
    'guests:donorMessage': 'Message pour les mariés (optionnel)',
    'guests:messagePlaceholder': 'Écrivez un message spécial pour Iluminada et George...',
    'guests:paymentSummary': 'Résumé du Cadeau',
    'guests:proceedPayment': 'Procéder au Paiement',
    'guests:selectAmount': 'Veuillez sélectionner un montant',
    'guests:fillRequired': 'Veuillez remplir tous les champs obligatoires',
    'guests:processing': 'Traitement du paiement...',
    'guests:error': 'Erreur lors du traitement du paiement',

    // Admin
    'admin:pageTitle': 'Panel d\'Administration',
    'admin:title': 'Panel d\'Administration',
    'admin:home': 'Accueil',
    'admin:logout': 'Se déconnecter',
    'admin:welcomeTitle': 'Bienvenue, Administrateur',
    'admin:welcomeDesc': 'Gérez toutes les informations du mariage d\'Iluminada et George',
    'admin:tab.guests': 'Invités',
    'admin:tab.gifts': 'Liste de Cadeaux',
    'admin:tab.messages': 'Messages',
    'admin:tab.events': 'Les Événements',
    'admin:tab.menus': 'Gestion des Menus',
    'admin:tab.settings': 'Configuration',
    'admin:loading': 'Chargement...',
    'admin:loadingGuests': 'Chargement des invités...',
    'admin:uploadingGuests': 'Chargement des invités...',
    'admin:loadingPartyMembers': 'Chargement des miembros del grupo...',
    'admin:loadingGiftList': 'Chargement de la liste de cadeaux...',
    'admin:loadingMessages': 'Chargement des messages...',
    'admin:loadingEventSchedule': 'Chargement de l\'agenda des événements...',
    'admin:loadingCourses': 'Chargement des cours...',
    'admin:loadingSettings': 'Chargement des paramètres...',
    'admin:footer': 'Panel d\'administration',

    // Admin Guests Section
    'admin:guests.errorLoading': 'Échec du chargement des invités',
    'admin:guests.adult': 'Adulte',
    'admin:guests.child': 'Enfant',
    'admin:guests.totalGuests': 'Total Invités',
    'admin:guests.acrossParties': 'À travers {{count}} {{partyWord}}',
    'admin:guests.addGuest': 'Ajouter Invité',
    'admin:guests.bulkUploadCsv': 'Téléchargement en Masse CSV',
    'admin:guests.table.name': 'Nom',
    'admin:guests.table.email': 'Email',
    'admin:guests.table.ageCategory': 'Catégorie d\'Âge',
    'admin:guests.table.partySize': 'Taille du Groupe',
    'admin:guests.table.actions': 'Actions',
    'admin:guests.confirmDelete': 'Supprimer cet invité et tout son groupe ?',
    'admin:guests.editTitle': 'Modifier invité',
    'admin:guests.addTitle': 'Ajouter invité',
    'admin:guests.save': 'Enregistrer',
    'admin:guests.add': 'Ajouter',
    'admin:guests.field.name': 'Nom',
    'admin:guests.field.email': 'Email',
    'admin:guests.field.ageCategory': 'Catégorie d\'Âge',
    'admin:guests.option.adult': 'Adulte (18+)',
    'admin:guests.option.child': 'Enfant (Moins de 18)',
    'admin:guests.csv.noValidGuests': 'Aucun invité valide trouvé dans le fichier CSV',
    'admin:guests.csv.uploadCount': 'Téléverser {{count}} invités ?',
    'admin:guests.csv.preview': 'Aperçu :',
    'admin:guests.csv.more': '... et {{count}} de plus',
    'admin:guests.csv.uploadComplete': 'Téléversement terminé !',
    'admin:guests.csv.successCreated': 'Créés avec succès : {{count}}',
    'admin:guests.csv.skippedDuplicates': 'Ignorés (doublons/vides) : {{count}}',
    'admin:guests.csv.errors': 'Erreurs : {{count}}',
    'admin:guests.csv.firstError': 'Première erreur : {{error}}',
    'admin:guests.csv.uploadingError': 'Erreur lors du téléversement CSV : {{error}}',
    'admin:guests.error.title': 'Erreur de Chargement des Invités',
    'admin:guests.error.failed': 'Échec du chargement des invités : {{error}}',
    'admin:guests.retry': 'Réessayer',

    // Admin Party Management Section
    'admin:party.title': 'Gérer le Groupe : ',
    'admin:party.description': 'Gérer les membres du groupe pour cet invité',
    'admin:party.backToGuests': 'Retour aux Invités',
    'admin:party.primaryGuest': 'Invité Principal',
    'admin:party.unknown': 'Inconnu',
    'admin:party.adult': 'Adulte',
    'admin:party.child': 'Enfant',
    'admin:party.partyMembers': 'Membres du Groupe',
    'admin:party.addMember': 'Ajouter un Membre',
    'admin:party.noMembers': 'Aucun membre de groupe ajouté pour le moment.',
    'admin:party.table.name': 'Nom',
    'admin:party.table.ageGroup': "Groupe d'Âge",
    'admin:party.table.actions': 'Actions',
    'admin:party.addModalTitle': 'Ajouter un Membre du Groupe',
    'admin:party.add': 'Ajouter',
    'admin:party.field.name': 'Nom',
    'admin:party.field.ageGroup': "Groupe d'Âge",
    'admin:party.option.adult': 'Adulte (18+)',
    'admin:party.option.child': 'Enfant (Moins de 18)',
    'admin:party.editModalTitle': 'Modifier un Membre du Groupe',
    'admin:party.save': 'Enregistrer',
    'admin:party.confirmRemove': 'Supprimer ce membre du groupe ?',
    'admin:party.error.title': 'Erreur de Chargement du Groupe',
    'admin:party.error.failed': 'Échec du chargement des membres du groupe : {{error}}',
    'admin:party.error.loadFailed': 'Échec du chargement des membres du groupe',
    'admin:party.error.addFailed': "Échec de l'ajout du membre du groupe",
    'admin:party.error.removeFailed': 'Échec de la suppression du membre du groupe',
    'admin:party.error.updateFailed': 'Échec de la mise à jour du membre du groupe',
    'admin:party.error.loadingError': 'Erreur lors du chargement des membres du groupe : {{error}}',
    'admin:party.retry': 'Réessayer',

    // Admin Gifts Section
    'admin:gifts.title': 'Liste de Cadeaux',
    'admin:gifts.add': 'Ajouter',
    'admin:gifts.edit': 'Modifier cadeau',
    'admin:gifts.save': 'Enregistrer',
    'admin:gifts.deleteConfirm': 'Supprimer ce cadeau ?',
    'admin:gifts.noImage': 'Pas d\'image',
    'admin:gifts.grandTotal': 'Total Général',
    'admin:gifts.grandTotalDescription': 'Les cartes disponibles x prix',
    'admin:gifts.table.name': 'Nom',
    'admin:gifts.table.description': 'Description',
    'admin:gifts.table.image': 'Image',
    'admin:gifts.table.available': 'Disponible',
    'admin:gifts.table.price': 'Prix',
    'admin:gifts.table.purchased': 'Acheté',
    'admin:gifts.table.actions': 'Actions',
    'admin:gifts.field.name': 'Nom',
    'admin:gifts.field.description': 'Description',
    'admin:gifts.field.image': 'Image',
    'admin:gifts.field.available': 'Nombre Disponible',
    'admin:gifts.field.price': 'Prix',
    'admin:gifts.field.imageHelp': 'Télécharger une image de carte cadeau (sera stockée dans la base de données)',
    'admin:gifts.priceOption.25': '€25',
    'admin:gifts.priceOption.50': '€50',
    'admin:gifts.priceOption.100': '€100',
    'admin:gifts.priceOption.200': '€200',
    'admin:gifts.priceOption.500': '€500'
  },
  de: {
    'wedding:title': 'Iluminada & George',
    'wedding:subtitle': 'Wir heiraten!',
    'wedding:date': '6. Juni 2026 • Marbella, Spanien',
    'wedding:hero.description': 'Iluminada und George heiraten im Juni am Strand von Marbella und wir freuen uns sehr, das mit euch zu teilen. Sonne, Meer und viele Momente zum Lachen.',
    'wedding:hero.description2': 'Diese Seite ist euer Hochzeitsportal. Meldet euch mit der RSVP-E-Mail an, um eure Gruppe zu bestätigen, euer Menü zu wählen, den Ablauf zu sehen, die Geschenkliste anzuschauen und mit anderen Gästen zu chatten.',
  
    'wedding:guestZone.title': 'Gästebereich',
    'wedding:guestZone.description': 'Hier könnt ihr alle Details zu eurer Teilnahme an unserer Hochzeit verwalten.',
    'common:days': 'Tage',
    'common:hours': 'Stunden',
    'common:minutes': 'Minuten',
    'common:seconds': 'Sekunden',
    'common:primary': 'Hauptgast',
    'common:saving': 'Speichern...',
    'common:menuSelectionsSaved': 'Menüauswahl erfolgreich gespeichert!',
    'common:errorSavingMenuSelections': 'Fehler beim Speichern der Menüauswahl',
    'common:menuSelectionSaved': 'Menüauswahl erfolgreich gespeichert!',
    'common:errorSavingMenuSelection': 'Fehler beim Speichern der Menüauswahl',
    'common:specialRequestSaved': 'Spezielle Anfrage erfolgreich gespeichert!',
    'common:errorSavingSpecialRequest': 'Fehler beim Speichern der speziellen Anfrage',
    'common:specialRequestDetailsSaved': 'Details zur speziellen Anfrage erfolgreich gespeichert!',
    'common:errorSavingSpecialRequestDetails': 'Fehler beim Speichern der Details zur speziellen Anfrage',
  
    'common:login': 'Anmelden',
    'login:pageTitle': 'Gastzugang – Hochzeit',
    'login:header': 'Gastzugang',
    'login:home': 'Startseite',
    'login:emailLabel': 'E-Mail:',
    'login:emailPlaceholder': 'E-Mail-Adresse eingeben',
    'login:submit': 'Weiter',
    'login:enterEmail': 'Bitte gebt eure E-Mail-Adresse ein.',
    'login:successRedirect': 'Anmeldung erfolgreich. Weiterleitung...',
    'login:emailNotFound': 'E-Mail-Adresse nicht in der Gästeliste gefunden',
    'login:serverError': 'Serververbindungsfehler',
  
    'adminLogin:pageTitle': 'Admin-Login – Hochzeit von Iluminada & George',
    'adminLogin:header': 'Admin-Login',
    'adminLogin:home': 'Startseite',
    'adminLogin:subHeader': 'Zugang zum Adminbereich',
    'adminLogin:description': 'Gebt eure Zugangsdaten ein, um Hochzeitsdetails und RSVPs zu verwalten.',
    'adminLogin:username': 'Benutzername',
    'adminLogin:usernamePlaceholder': 'Benutzername',
    'adminLogin:password': 'Passwort',
    'adminLogin:passwordPlaceholder': 'Euer geheimes Passwort',
    'adminLogin:submit': 'Anmelden',
  
    'common:advancedFeatures': 'Beispiele für erweiterte Funktionen',
    'common:numberFormatting': 'Zahlenformatierung',
    'common:price': 'Preis',
    'common:percentage': 'Prozentangabe',
    'common:dateFormatting': 'Datumsformatierung',
    'common:currentDate': 'Heutiges Datum',
    'common:currentTime': 'Aktuelle Uhrzeit',
    'common:currencyFormatting': 'Währungsformatierung',
    'common:gift': 'Geschenk',
  
    'guests:title': 'Gästebereich – Hochzeit von Iluminada & George',
    'guests:welcomeTitle': 'Gästebereich',
    'guests:tabSummary': 'Übersicht',
    'guests:tabMenu': 'Menü',
    'guests:tabAgenda': 'Programm',
    'guests:tabRSVP': 'RSVP',
    'guests:tabGifts': 'Geschenke',
    'guests:menuSelection': 'Menüauswahl',
    'guests:menuSelectionDesc': 'Eure aktuelle Menüauswahl für unsere Hochzeit.',
    'guests:menuSelectionDesc2': 'Wählt eure bevorzugten Gerichte für unsere Hochzeit.',

    // Summary Page
    'guests:summaryPageTitle': 'Willkommen auf den Seiten von Iluminada & George',
    'rich:guests:summaryPageDescription': 'Hier findest du alle Informationen, die du benötigst, um zur Hochzeit zu kommen und sie zu genießen.',

    // Party Page
    'guests:partyPageTitle': 'Ihre Gruppe',
    'guests:partyPageDescription': 'Verwaltung Ihres Gruppenmitglieds und ihrer speziellen Bedürfnisse.',

    // Events Page
    'guests:eventsPageTitle': 'RSVP zu den Hochzeitsveranstaltungen unten',
    'guests:eventsPageDescription': 'Wir freuen uns sehr, euch bei unserer Hochzeit dabei zu haben. Hier sind die Details aller Veranstaltungen, die stattfinden werden. Bitte wählt euren Namen bei jeder Veranstaltung im Abschnitt Who\'s Attending aus. So können wir alles vorbereiten, damit ihr eine großartige Zeit habt.',
    'guests:eventAgenda': 'Veranstaltungsprogramm',
    'guests:eventsLoading': 'Veranstaltungen werden geladen...',
    'guests:eventsNoEvents': 'Keine Veranstaltungen verfügbar',
    'guests:eventsNoEventsDescription': 'Es sind noch keine Veranstaltungen geplant. Bitte schaut später nochmal vorbei.',
    'guests:eventsNoPartyMembers': 'Keine Gruppenmitglieder gefunden.',
    'guests:eventsViewOnMap': 'Auf Karte ansehen',
    'guests:eventsWhosAttending': 'Wer nimmt teil?',
    'guests:eventsErrorTitle': 'Fehler beim Laden der Veranstaltungen',
    'guests:eventsErrorMessage': 'Beim Laden der Veranstaltungen ist ein Problem aufgetreten. Bitte versucht es erneut.',
    'guests:eventsSchedule': 'Programm',
    'guests:childBadge': 'Kind',
    'guests:eventsAttendanceSavedSuccess': 'Teilnahme-Auswahl erfolgreich gespeichert!',
    'guests:eventsAttendanceSavedError': 'Fehler beim Speichern der Teilnahme-Auswahl',
    'guests:eventsSaveAttendanceChoices': 'Teilnahme-Auswahl Speichern',
    'guests:eventAgendaDesc': 'Eure Teilnahmebestätigungen für unsere Hochzeitsveranstaltungen.',
    'guests:eventAgendaDesc2': 'Bestätigt eure Teilnahme an unseren Hochzeitsveranstaltungen.',
    'guests:eventRSVP': 'RSVP',
    'guests:eventRSVPSummary': 'Eure Teilnahmebestätigungen für unsere Hochzeitsveranstaltungen.',
    'guests:eventRSVPDesc': 'Die Feierlichkeiten finden an drei Tagen statt: Freitag, Samstag und Sonntag. Am Freitag beginnt alles mit einem Willkommensabendessen. Am Samstag gibt es ein ganztägiges Programm mit Trauung, Festessen und Tanzen. Am Sonntag erwartet euch ein Abschiedsbrunch. Bitte bestätigt, an welchen dieser Veranstaltungen ihr teilnehmen werdet.',
    'guests:giftList': 'Geschenkliste',
    'guests:giftListDesc': 'Eure reservierten Geschenke aus unserer Wunschliste.',
    'guests:giftListDesc2': 'Wenn ihr uns ein Geschenk machen möchtet, findet ihr hier unsere Wunschliste. Ihr könnt jedes Geschenk reservieren, das euch gefällt.',
    'guests:logout': 'Abmelden',
    'guests:backToHome': 'Zurück zur Startseite',
    'guests:confirmed': 'Bestätigt',
    'guests:pending': 'Ausstehend',
    'guests:event': 'Veranstaltung',
    'guests:reserved': 'Reserviert',

    // Menu Page
    'guests:menuPageTitle': 'Menüauswahl',
    'guests:menuPageDescription': 'Wählt eure bevorzugten Gerichte für unsere Hochzeit.',
    'guests:currentSelection': 'Eure aktuelle Auswahl',
    'guests:starter': 'Vorspeise:',
    'guests:mainCourse': 'Hauptgang:',
    'guests:dessert': 'Dessert:',
    'guests:specialOption': 'Spezialoption:',
    'guests:allergies': 'Allergien:',
    'guests:notSelected': 'Nicht ausgewählt',
    'guests:selectionStatus': 'Auswahlstatus',
    'guests:noSelectionYet': 'Ihr habt euer Menü noch nicht ausgewählt. Klickt oben auf die Schaltfläche, um zu beginnen.',
    'guests:eventConfirmations': 'Eure Veranstaltungsbestätigungen',
    'guests:noEventConfirmations': 'Ihr habt noch keine Teilnahme an Veranstaltungen bestätigt.',
    'guests:giftReservations': 'Eure reservierten Geschenke',
    'guests:noGiftReservations': 'Ihr habt noch keine Geschenke aus unserer Liste reserviert.',
    'guests:confirmAction': 'Aktion bestätigen',
    'guests:commentsTitle': 'Kommentare',
    'rich:guests:commentsSubtitle': 'Teilt eure Gedanken mit anderen Gästen',
    'rich:guests:commentPlaceholder': `
      <textarea
        id="newComment"
        name="comment"
        placeholder="Schreibt euren Kommentar..."
        rows="3"
        maxlength="500"
      ></textarea>
    `,
    'guests:postComment': 'Veröffentlichen',
    'guests:loadingComments': 'Kommentare werden geladen...',
    'guests:noComments': 'Noch keine Kommentare. Seid die Ersten!',
    'guests:commentPosted': 'Kommentar erfolgreich veröffentlicht',
    'guests:commentDeleted': 'Kommentar erfolgreich gelöscht',
    'guests:deleteCommentConfirm': 'Seid ihr sicher, dass ihr diesen Kommentar löschen möchtet?',
    'guests:cancel': 'Abbrechen',
    'guests:confirm': 'Bestätigen',
    'guests:errorLoadingMenu': 'Fehler beim Laden des Menüs:',
    'guests:errorConnection': 'Serververbindungsfehler.',
    'guests:welcome': 'Willkommen',
    'guests:welcomePersonalized': 'Willkommen',
    'guests:menuSaved': 'Menü erfolgreich gespeichert',
    
    // Menu Selection Page
    'guests:menuLoading': 'Menü wird geladen...',
    'guests:menuErrorTitle': 'Fehler beim Laden des Menüs',
    'guests:menuErrorMessage': 'Menüdaten konnten nicht geladen werden. Bitte versuchen Sie es später erneut.',
    'guests:menuErrorMessage2': 'Beim Laden des Menüs ist ein Problem aufgetreten. Bitte versuchen Sie es erneut.',
    'guests:retry': 'Wiederholen',
    'guests:courseGroupStarters': 'Vorspeisen',
    'guests:courseGroupMainCourses': 'Hauptgerichte',
    'guests:courseGroupDesserts': 'Desserts',
    'guests:courseGroupDrinks': 'Getränke',
    'guests:selectionRequired': 'Auswahl Erforderlich',
    'guests:infoOnly': 'Nur Info',
    'guests:whosHavingThis': 'Wer nimmt das?',
    'guests:selectedCount': 'ausgewählt',
    'guests:dietaryRequirementsTitle': 'Ernährungsbedürfnisse & Spezielle Wünsche',
    'guests:dietaryRequirementsDescription': 'Bitte teilen Sie uns alle Ernährungsbedürfnisse oder Allergien für jeden Gast mit.',
    'guests:dietaryVegetarian': 'Vegetarisch',
    'guests:dietaryLactoseIntolerant': 'Laktoseintolerant',
    'guests:dietaryGlutenIntolerant': 'Glutenintolerant',
    'guests:dietaryNutAllergy': 'Nussallergie',
    'guests:dietaryOther': 'Andere',
    'guests:additionalDetailsLabel': 'Zusätzliche Details oder spezielle Anforderungen:',
    'guests:saveMenuSelections': 'Menüauswahl Speichern',
    
    'common:home': 'Startseite',
  
    // Gifts
    'guests:giftsPageTitle': 'Gifts list',
    'guests:giftsPageDescription': 'Your presence is our gift. But if you want to contribute to our honeymoon you can choose an amusing gift from the list below and it will be printed with your message and displayed on a big wall at the wedding banquet.  The cash amount you choose will be used to fund our honeymoon.  Thank you',
    'guests:giftsLoading': 'Geschenke werden geladen...',
    'guests:giftsThankYouTitle': 'Vielen Dank für Ihre Großzügigkeit!',
    'guests:giftsThankYouMessage': 'Wir sind sehr dankbar für Ihre wunderbaren Geschenke',
    'rich:guests:giftsDonatedOn': 'Geschenkt am {{date}}',
    'guests:giftsRegistryTitle': 'Geschenkliste',
    'guests:giftsRegistrySubtitle': 'Wählen Sie aus unseren sorgfältig ausgewählten Geschenken',
    'guests:giftsNoAvailable': 'Keine Geschenke verfügbar',
    'guests:giftsNoAvailableDescription': 'Bitte schauen Sie später wieder für unsere Geschenkliste vorbei.',
    'guests:giftsAvailable': 'verfügbar',
    'guests:giftsSoldOut': 'Ausverkauft',
    'guests:giftsBuyGift': 'Geschenk Kaufen',
    'guests:giftsPaymentSuccess': 'Vielen Dank für Ihr Geschenk! Ihre Zahlung war erfolgreich.',
    'guests:giftsPaymentCancelled': 'Zahlung wurde abgebrochen.',
    'guests:giftsErrorLoading': 'Fehler beim Laden der Geschenke',
    'guests:giftsErrorLoadingDescription': 'Beim Laden der Geschenke ist ein Problem aufgetreten. Bitte versuchen Sie es erneut.',
    'guests:giftsRetry': 'Wiederholen',
    'guests:giftsPurchaseTitle': 'Geschenk Kaufen',
    'guests:giftsPurchaseAbout': 'Sie sind dabei, folgendes zu kaufen:',
    'guests:giftsPurchaseMessageLabel': 'Eine persönliche Nachricht hinzufügen (optional):',
    'guests:giftsPurchaseMessagePlaceholder': 'Hinterlassen Sie eine lovely message für das Paar...',
    'guests:giftsPurchaseCancel': 'Abbrechen',
    'guests:giftsPurchaseProceed': 'Zur Zahlung Fortfahren',
    'guests:giftsPurchaseProcessing': 'Verarbeitung...',
    'guests:giftsPaymentError': 'Fehler bei der Zahlungsverarbeitung',
    'guests:giftsPaymentServiceError': 'Fehler beim Verbinden mit dem Zahlungsdienst',
    'guests:tabCash': 'Geschenke',
    'guests:cashGifts': 'Geldgeschenke',
    'guests:cashGiftsDesc': 'Wenn ihr uns lieber ein Geldgeschenk machen möchtet, könnt ihr einen festen oder eigenen Betrag wählen. Eure Großzügigkeit hilft uns, unser gemeinsames Leben zu beginnen.',
    'guests:cashGiftsSummaryDesc': 'Eure geleisteten Geldgeschenke zu unserer Hochzeit.',
    'guests:cashGiftsSummary': 'Übersicht Geldgeschenke',
    'guests:totalAmount': 'Gesamtbetrag:',
    'guests:giftCount': 'Anzahl der Geschenke:',
    'guests:lastGift': 'Letztes Geschenk:',
    'guests:noCashGifts': 'Ihr habt bisher noch keine Geldgeschenke gemacht.',
    'guests:giftDate': 'Geschenkt am:',
    'guests:giftMessage': 'Nachricht:',
    'guests:giftHistory': 'Geschenkverlauf',
    'guests:smallGift': 'Kleines Geschenk',
    'guests:mediumGift': 'Mittleres Geschenk',
    'guests:generousGift': 'Großzügiges Geschenk',
    'guests:specialGift': 'Besonderes Geschenk',
    'guests:donorInfo': 'Eure Angaben',
    'guests:donorName': 'Vollständiger Name',
    'guests:donorEmail': 'E-Mail',
    'guests:donorMessage': 'Nachricht an das Paar (optional)',
    'guests:messagePlaceholder': 'Schreibt eine besondere Nachricht an Iluminada und George...',
    'guests:paymentSummary': 'Geschenkübersicht',
    'guests:proceedPayment': 'Zur Zahlung fortfahren',
    'guests:selectAmount': 'Bitte wählt einen Betrag',
    'guests:fillRequired': 'Bitte füllt alle Pflichtfelder aus',
    'guests:processing': 'Zahlung wird verarbeitet...',
    'guests:error': 'Fehler bei der Zahlungsabwicklung',
  
    // Admin
    'admin:pageTitle': 'Adminbereich – Hochzeit von Iluminada & George',
    'admin:title': 'Adminbereich',
    'admin:home': 'Startseite',
    'admin:logout': 'Abmelden',
    'admin:welcomeTitle': 'Willkommen, Administrator',
    'admin:welcomeDesc': 'Verwalte alle Hochzeitsinformationen für Iluminada und George',
    'admin:tab.guests': 'Gäste',
    'admin:tab.gifts': 'Geschenkliste',
    'admin:tab.messages': 'Nachrichten',
    'admin:tab.events': 'Veranstaltungen',
    'admin:tab.menus': 'Menüverwaltung',
    'admin:tab.settings': 'Einstellungen',
    'admin:loading': 'Wird geladen...',
    'admin:loadingGuests': 'Gäste werden geladen...',
    'admin:uploadingGuests': 'Gäste werden hochgeladen...',
    'admin:loadingPartyMembers': 'Gäste werden geladen...',
    'admin:loadingGiftList': 'Geschenke werden geladen...',
    'admin:loadingMessages': 'Nachrichten werden geladen...',
    'admin:loadingEventSchedule': 'Veranstaltungen werden geladen...',
    'admin:loadingCourses': 'Kurse werden geladen...',
    'admin:loadingSettings': 'Einstellungen werden geladen...',
    'admin:footer': 'Adminbereich',

    // Admin Guests Section
    'admin:guests.errorLoading': 'Fehler beim Laden der Gäste',
    'admin:guests.adult': 'Erwachsener',
    'admin:guests.child': 'Kind',
    'admin:guests.totalGuests': 'Gäste Insgesamt',
    'admin:guests.acrossParties': 'Über {{count}} {{partyWord}}',
    'admin:guests.addGuest': 'Gast Hinzufügen',
    'admin:guests.bulkUploadCsv': 'Massen-Upload CSV',
    'admin:guests.table.name': 'Name',
    'admin:guests.table.email': 'E-Mail',
    'admin:guests.table.ageCategory': 'Alterskategorie',
    'admin:guests.table.partySize': 'Gruppengröße',
    'admin:guests.table.actions': 'Aktionen',
    'admin:guests.confirmDelete': 'Diesen Gast und seine gesamte Gruppe löschen?',
    'admin:guests.editTitle': 'Gast bearbeiten',
    'admin:guests.addTitle': 'Gast hinzufügen',
    'admin:guests.save': 'Speichern',
    'admin:guests.add': 'Hinzufügen',
    'admin:guests.field.name': 'Name',
    'admin:guests.field.email': 'E-Mail',
    'admin:guests.field.ageCategory': 'Alterskategorie',
    'admin:guests.option.adult': 'Erwachsener (18+)',
    'admin:guests.option.child': 'Kind (Unter 18)',
    'admin:guests.csv.noValidGuests': 'Keine gültigen Gäste in CSV-Datei gefunden',
    'admin:guests.csv.uploadCount': '{{count}} Gäste hochladen?',
    'admin:guests.csv.preview': 'Vorschau:',
    'admin:guests.csv.more': '... und {{count}} weitere',
    'admin:guests.csv.uploadComplete': 'Upload abgeschlossen!',
    'admin:guests.csv.successCreated': 'Erfolgreich erstellt: {{count}}',
    'admin:guests.csv.skippedDuplicates': 'Übersprungen (Duplikate/leer): {{count}}',
    'admin:guests.csv.errors': 'Fehler: {{count}}',
    'admin:guests.csv.firstError': 'Erster Fehler: {{error}}',
    'admin:guests.csv.uploadingError': 'Fehler beim CSV-Upload: {{error}}',
    'admin:guests.error.title': 'Fehler beim Laden der Gäste',
    'admin:guests.error.failed': 'Fehler beim Laden der Gäste: {{error}}',
    'admin:guests.retry': 'Wiederholen',

    // Admin Party Management Section
    'admin:party.title': 'Gruppe Verwalten: ',
    'admin:party.description': 'Gruppenmitglieder für diesen Gast verwalten',
    'admin:party.backToGuests': 'Zurück zu Gästen',
    'admin:party.primaryGuest': 'Hauptgast',
    'admin:party.unknown': 'Unbekannt',
    'admin:party.adult': 'Erwachsener',
    'admin:party.child': 'Kind',
    'admin:party.partyMembers': 'Gruppenmitglieder',
    'admin:party.addMember': 'Mitglied Hinzufügen',
    'admin:party.noMembers': 'Noch keine Gruppenmitglieder hinzugefügt.',
    'admin:party.table.name': 'Name',
    'admin:party.table.ageGroup': 'Altersgruppe',
    'admin:party.table.actions': 'Aktionen',
    'admin:party.addModalTitle': 'Gruppenmitglied Hinzufügen',
    'admin:party.add': 'Hinzufügen',
    'admin:party.field.name': 'Name',
    'admin:party.field.ageGroup': 'Altersgruppe',
    'admin:party.option.adult': 'Erwachsener (18+)',
    'admin:party.option.child': 'Kind (Unter 18)',
    'admin:party.editModalTitle': 'Gruppenmitglied Bearbeiten',
    'admin:party.save': 'Speichern',
    'admin:party.confirmRemove': 'Dieses Gruppenmitglied entfernen?',
    'admin:party.error.title': 'Fehler beim Laden der Gruppe',
    'admin:party.error.failed': 'Fehler beim Laden der Gruppenmitglieder: {{error}}',
    'admin:party.error.loadFailed': 'Fehler beim Laden der Gruppenmitglieder',
    'admin:party.error.addFailed': 'Fehler beim Hinzufügen des Gruppenmitglieds',
    'admin:party.error.removeFailed': 'Fehler beim Entfernen des Gruppenmitglieds',
    'admin:party.error.updateFailed': 'Fehler beim Aktualisieren des Gruppenmitglieds',
    'admin:party.error.loadingError': 'Fehler beim Laden der Gruppenmitglieder: {{error}}',
    'admin:party.retry': 'Wiederholen',

    // Admin Gifts Section
    'admin:gifts.title': 'Geschenkliste',
    'admin:gifts.add': 'Hinzufügen',
    'admin:gifts.edit': 'Geschenk bearbeiten',
    'admin:gifts.save': 'Speichern',
    'admin:gifts.deleteConfirm': 'Dieses Geschenk löschen?',
    'admin:gifts.noImage': 'Kein Bild',
    'admin:gifts.grandTotal': 'Gesamtsumme',
    'admin:gifts.grandTotalDescription': 'Die verfügbaren Karten x Preis',
    'admin:gifts.table.name': 'Name',
    'admin:gifts.table.description': 'Beschreibung',
    'admin:gifts.table.image': 'Bild',
    'admin:gifts.table.available': 'Verfügbar',
    'admin:gifts.table.price': 'Preis',
    'admin:gifts.table.purchased': 'Gekauft',
    'admin:gifts.table.actions': 'Aktionen',
    'admin:gifts.field.name': 'Name',
    'admin:gifts.field.description': 'Beschreibung',
    'admin:gifts.field.image': 'Bild',
    'admin:gifts.field.available': 'Verfügbare Anzahl',
    'admin:gifts.field.price': 'Preis',
    'admin:gifts.field.imageHelp': 'Geschenkkartenbild hochladen (wird in der Datenbank gespeichert)',
    'admin:gifts.priceOption.25': '€25',
    'admin:gifts.priceOption.50': '€50',
    'admin:gifts.priceOption.100': '€100',
    'admin:gifts.priceOption.200': '€200',
    'admin:gifts.priceOption.500': '€500'
  },
    

};

// Language Configuration
const languages = {
  es: { name: 'Español', flag: '🇪🇸', rtl: false },
  en: { name: 'English', flag: '🇬🇧', rtl: false },
  fr: { name: 'Français', flag: '🇫🇷', rtl: false },
  de: { name: 'Deutsch', flag: '🇩🇪', rtl: false },
};

// Initialize current language - check localStorage first, then browser preferences, fallback to 'es'
let currentLanguage = detectAndSetBrowserLanguage();

function translate(key, lang = currentLanguage) {
  const translation = translations[lang]?.[key];
  return translation || key;
}

// Translation helper function for variable substitution
function translateWithVars(key, vars = {}) {
  let translation = translate(key);
  for (const [varName, varValue] of Object.entries(vars)) {
    translation = translation.replace(new RegExp(`{{${varName}}}`, 'g'), varValue);
  }
  return translation;
}


function updatePageContent() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const isRich = key.startsWith('rich:');
    const translation = translate(key);

    if (translation !== key) {
      if (isRich) {
        element.innerHTML = translation;   // render HTML
      } else {
        element.textContent = translation; // plain text
      }
    }
  });
}

function updateLanguageSelector() {
  const toggle = document.getElementById('language-toggle');
  const currentLang = languages[currentLanguage];
  
  if (toggle) {
    toggle.innerHTML = `
      <span class="current-language">
        <span class="flag">${currentLang.flag}</span>
        <span class="name">${currentLang.name}</span>
      </span>
      <i class="fas fa-chevron-down"></i>
    `;
  }
  
  // Update active options
  document.querySelectorAll('.language-option').forEach(option => {
    const lang = option.getAttribute('data-lang');
    if (lang === currentLanguage) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}

function updateDocumentDirection() {
  const isRTL = languages[currentLanguage].rtl;
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = currentLanguage;
}

async function changeLanguage(lang) {
  if (!languages[lang]) {
    console.warn(`Language ${lang} is not supported`);
    return false;
  }

  try {
    currentLanguage = lang;
    
    // Save preference
    localStorage.setItem('i18nextLng', lang);
    
    // Update document direction
    updateDocumentDirection();
    
    // Update content
    updatePageContent();
    
    // Update selector
    updateLanguageSelector();
    
    // Update formatting
    updateFormatting();
    
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
            
    console.log(`Language changed to: ${lang}`);
    return true;
  } catch (error) {
    console.error(`Error changing language: ${error.message}`);
    return false;
  }
}

function detectAndSetBrowserLanguage() {
  // Check if language is already set in localStorage
  const savedLanguage = localStorage.getItem('i18nextLng');
  if (savedLanguage) {
    console.log(`Language already set to: ${savedLanguage}`);
    return savedLanguage;
  }

  // Get browser's preferred languages
  const browserLanguages = [
    navigator.language,
    navigator.languages?.[0],
    navigator.userLanguage,
    navigator.browserLanguage
  ].filter(Boolean); // Remove undefined values

  console.log('Browser preferred languages:', browserLanguages);

  // Map browser languages to supported languages
  const languageMap = {
    // Spanish variants
    'es': 'es', 'es-ES': 'es', 'es-MX': 'es', 'es-AR': 'es', 'es-CO': 'es', 'es-PE': 'es', 
    'es-VE': 'es', 'es-CL': 'es', 'es-UY': 'es', 'es-PY': 'es', 'es-BO': 'es', 'es-EC': 'es',
    'es-CR': 'es', 'es-PA': 'es', 'es-NI': 'es', 'es-HN': 'es', 'es-GT': 'es', 'es-SV': 'es',
    'es-DO': 'es', 'es-PR': 'es', 'es-CU': 'es',
    
    // English variants  
    'en': 'en', 'en-US': 'en', 'en-GB': 'en', 'en-CA': 'en', 'en-AU': 'en', 'en-NZ': 'en',
    'en-IE': 'en', 'en-ZA': 'en', 'en-IN': 'en', 'en-SG': 'en', 'en-HK': 'en',
    
    // French variants
    'fr': 'fr', 'fr-FR': 'fr', 'fr-CA': 'fr', 'fr-BE': 'fr', 'fr-CH': 'fr', 'fr-LU': 'fr',
    'fr-MC': 'fr', 'fr-DZ': 'fr', 'fr-MA': 'fr', 'fr-TN': 'fr', 'fr-SN': 'fr', 'fr-ML': 'fr',
    'fr-BF': 'fr', 'fr-NE': 'fr', 'fr-CI': 'fr', 'fr-CM': 'fr', 'fr-CD': 'fr', 'fr-CG': 'fr',
    'fr-GA': 'fr', 'fr-GQ': 'fr', 'fr-VU': 'fr', 'fr-PM': 'fr', 'fr-WF': 'fr', 'fr-YT': 'fr',
    'fr-PF': 'fr', 'fr-NC': 'fr', 'fr-RE': 'fr', 'fr-MF': 'fr', 'fr-GP': 'fr', 'fr-MQ': 'fr',
    'fr-GF': 'fr',
  
    // German variants
    'de': 'de', 'de-DE': 'de', 'de-AT': 'de', 'de-CH': 'de', 'de-LU': 'de', 'de-LI': 'de'
  };
  

  // Try to find a supported language from browser preferences
  for (const browserLang of browserLanguages) {
    const normalizedLang = browserLang.toLowerCase();
    
    // Try exact match first
    if (languageMap[normalizedLang]) {
      const supportedLang = languageMap[normalizedLang];
      localStorage.setItem('i18nextLng', supportedLang);
      console.log(`Browser language detected and set to: ${supportedLang} (from: ${browserLang})`);
      return supportedLang;
    }
    
    // Try base language match (e.g., 'en-US' -> 'en')
    const baseLang = normalizedLang.split('-')[0];
    if (languageMap[baseLang]) {
      const supportedLang = languageMap[baseLang];
      localStorage.setItem('i18nextLng', supportedLang);
      console.log(`Browser base language detected and set to: ${supportedLang} (from: ${browserLang})`);
      return supportedLang;
    }
  }

  // Fallback to default language if no match found
  const defaultLanguage = 'es';
  localStorage.setItem('i18nextLng', defaultLanguage);
  console.log(`No matching browser language found, using default: ${defaultLanguage}`);
  return defaultLanguage;
}

function updateFormatting() {
  try {
    // Formatting numbers
    const priceElement = document.getElementById('formatted-price');
    const percentageElement = document.getElementById('formatted-percentage');
    
    if (priceElement) {
      priceElement.textContent = new Intl.NumberFormat(currentLanguage, { 
        style: 'decimal', 
        minimumFractionDigits: 2 
      }).format(1000);
    }
    
    if (percentageElement) {
      percentageElement.textContent = new Intl.NumberFormat(currentLanguage, { 
        style: 'percent', 
        minimumFractionDigits: 1 
      }).format(0.855);
    }
    
    // Formatting dates
    const dateElement = document.getElementById('formatted-date');
    const timeElement = document.getElementById('formatted-time');
    const now = new Date();
    
    if (dateElement) {
      dateElement.textContent = new Intl.DateTimeFormat(currentLanguage, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }).format(now);
    }
    
    if (timeElement) {
      timeElement.textContent = new Intl.DateTimeFormat(currentLanguage, { 
        hour: '2-digit', 
        minute: '2-digit' 
      }).format(now);
    }
    
    // Formatting currency
    const currencyElement = document.getElementById('formatted-currency');
    if (currencyElement) {
      const currency = currentLanguage === 'en' ? 'USD' : 'EUR';
      currencyElement.textContent = new Intl.NumberFormat(currentLanguage, {
        style: 'currency',
        currency: currency
      }).format(150);
    }
  } catch (error) {
    console.error('Error updating formatting:', error);
  }
}
